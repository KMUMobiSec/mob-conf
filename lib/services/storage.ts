export type StorageFileBody =
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | Buffer
  | File
  | FormData
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>
  | URLSearchParams
  | string;

export type StorageFileOptions = {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
  duplex?: string;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type StorageListOptions = {
  limit?: number;
  offset?: number;
  sortBy?: {
    column?: string;
    order?: string;
  };
  search?: string;
};

export type StorageTransformOptions = {
  width?: number;
  height?: number;
  resize?: "cover" | "contain" | "fill";
  format?: "origin" | "avif" | "webp";
  quality?: number;
};

export type StorageFetchParameters = {
  signal?: AbortSignal;
};

export type StorageUploadResult = {
  id: string;
  path: string;
  fullPath: string;
};

export type StorageSignedUploadUrlResult = {
  signedUrl: string;
  path: string;
  token: string;
};

export type StoragePublicUrlResult = {
  publicUrl: string;
};

export type StorageSignedUrlResult = {
  signedUrl: string;
};

export type StorageOperation =
  | "upload"
  | "download"
  | "delete"
  | "createSignedUrl"
  | "createSignedUploadUrl"
  | "list";

type SupabaseResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: NonNullable<unknown>;
    };

type StorageBucketClient = {
  upload(
    path: string,
    body: StorageFileBody,
    options?: StorageFileOptions,
  ): Promise<SupabaseResult<StorageUploadResult>>;
  createSignedUploadUrl(
    path: string,
    options?: { upsert: boolean },
  ): Promise<SupabaseResult<StorageSignedUploadUrlResult>>;
  download(
    path: string,
    options?: { transform?: StorageTransformOptions },
    parameters?: StorageFetchParameters,
  ): Promise<SupabaseResult<Blob>>;
  remove(paths: string[]): Promise<SupabaseResult<unknown>>;
  createSignedUrl(
    path: string,
    expiresIn: number,
    options?: { download?: string | boolean; transform?: StorageTransformOptions },
  ): Promise<SupabaseResult<StorageSignedUrlResult>>;
  getPublicUrl(
    path: string,
    options?: { download?: string | boolean; transform?: StorageTransformOptions },
  ): { data: StoragePublicUrlResult };
  list(
    prefix?: string,
    options?: StorageListOptions,
    parameters?: StorageFetchParameters,
  ): Promise<SupabaseResult<unknown>>;
};

export type SupabaseStorageClient = {
  storage: {
    from(bucket: string): StorageBucketClient;
  };
};

type StorageErrorContext = {
  operation: StorageOperation;
  bucket: string;
  path?: string;
  paths?: string[];
};

export class SupabaseStorageServiceError extends Error {
  readonly operation: StorageOperation;
  readonly bucket: string;
  readonly path?: string;
  readonly paths?: string[];
  override readonly cause: unknown;

  constructor(context: StorageErrorContext, cause: unknown) {
    super(createErrorMessage(context, cause), { cause });
    this.name = "SupabaseStorageServiceError";
    this.operation = context.operation;
    this.bucket = context.bucket;
    this.path = context.path;
    this.paths = context.paths;
    this.cause = cause;
  }
}

export type UploadFileInput = {
  bucket: string;
  path: string;
  body: StorageFileBody;
  options?: StorageFileOptions;
};

export type DownloadFileInput = {
  bucket: string;
  path: string;
  options?: { transform?: StorageTransformOptions };
  parameters?: StorageFetchParameters;
};

export type DeleteFilesInput = {
  bucket: string;
  paths: string[];
};

export type CreateSignedUrlInput = {
  bucket: string;
  path: string;
  expiresIn: number;
  options?: { download?: string | boolean; transform?: StorageTransformOptions };
};

export type CreateSignedUploadUrlInput = {
  bucket: string;
  path: string;
  options?: { upsert: boolean };
};

export type GetPublicUrlInput = {
  bucket: string;
  path: string;
  options?: { download?: string | boolean; transform?: StorageTransformOptions };
};

export type ListFilesInput = {
  bucket: string;
  prefix?: string;
  options?: StorageListOptions;
  parameters?: StorageFetchParameters;
};

export type StorageService = ReturnType<typeof createStorageService>;

export function createStorageService(client: SupabaseStorageClient) {
  return {
    async uploadFile({ bucket, path, body, options }: UploadFileInput) {
      const result = await client.storage.from(bucket).upload(path, body, options);
      return requireData(result, { operation: "upload", bucket, path });
    },

    async createSignedUploadUrl({ bucket, path, options }: CreateSignedUploadUrlInput) {
      const result = await client.storage.from(bucket).createSignedUploadUrl(path, options);
      return requireData(result, { operation: "createSignedUploadUrl", bucket, path });
    },

    async downloadFile({ bucket, path, options, parameters }: DownloadFileInput) {
      const bucketClient = client.storage.from(bucket);
      const result =
        parameters === undefined
          ? await bucketClient.download(path, options)
          : await bucketClient.download(path, options, parameters);
      return requireData(result, { operation: "download", bucket, path });
    },

    async deleteFiles({ bucket, paths }: DeleteFilesInput) {
      const result = await client.storage.from(bucket).remove(paths);
      return requireData(result, { operation: "delete", bucket, paths });
    },

    async createSignedUrl({ bucket, path, expiresIn, options }: CreateSignedUrlInput) {
      const result = await client.storage.from(bucket).createSignedUrl(path, expiresIn, options);
      return requireData(result, { operation: "createSignedUrl", bucket, path });
    },

    getPublicUrl({ bucket, path, options }: GetPublicUrlInput) {
      return client.storage.from(bucket).getPublicUrl(path, options).data;
    },

    async listFiles({ bucket, prefix = "", options, parameters }: ListFilesInput) {
      const result = await client.storage.from(bucket).list(prefix, options, parameters);
      return requireData(result, { operation: "list", bucket, path: prefix || undefined });
    },
  };
}

function requireData<T>(result: SupabaseResult<T>, context: StorageErrorContext): T {
  if (result.error !== null) {
    throw new SupabaseStorageServiceError(context, result.error);
  }

  return result.data;
}

function createErrorMessage(context: StorageErrorContext, cause: unknown): string {
  const location = context.path
    ? ` path "${context.path}"`
    : context.paths?.length
      ? ` paths "${context.paths.join(", ")}"`
      : "";
  return `Supabase storage ${context.operation} failed for bucket "${context.bucket}"${location}: ${getErrorMessage(cause)}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown storage error";
}

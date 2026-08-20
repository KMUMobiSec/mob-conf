import { describe, expect, it, vi } from "vitest";
import { createStorageService, SupabaseStorageServiceError } from "@/lib/services/storage";

function createStorageClient(overrides: Record<string, unknown> = {}) {
  const bucketApi = {
    upload: vi.fn().mockResolvedValue({
      data: {
        id: "file-id",
        path: "2026/cfp.pdf",
        fullPath: "conference-assets/2026/cfp.pdf",
      },
      error: null,
    }),
    download: vi.fn().mockResolvedValue({ data: new Blob(["file"]), error: null }),
    remove: vi.fn().mockResolvedValue({ data: [{ name: "2026/cfp.pdf" }], error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: "https://storage.example/signed" },
      error: null,
    }),
    createSignedUploadUrl: vi.fn().mockResolvedValue({
      data: {
        signedUrl: "https://storage.example/upload/sign/conference-assets/2026/cfp.pdf?token=abc",
        path: "2026/cfp.pdf",
        token: "abc",
      },
      error: null,
    }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://storage.example/public/2026/cfp.pdf" },
    }),
    list: vi.fn().mockResolvedValue({ data: [{ name: "cfp.pdf" }], error: null }),
    ...overrides,
  };
  const from = vi.fn().mockReturnValue(bucketApi);

  return {
    bucketApi,
    client: {
      storage: { from },
    },
    from,
  };
}

describe("Supabase storage service", () => {
  it("uploads a file to the bucket supplied for the operation", async () => {
    const { client, from, bucketApi } = createStorageClient();
    const service = createStorageService(client);
    const body = new Uint8Array([1, 2, 3]);
    const options = { cacheControl: "3600", contentType: "application/pdf", upsert: true };

    const result = await service.uploadFile({
      bucket: "conference-assets",
      path: "2026/cfp.pdf",
      body,
      options,
    });

    expect(from).toHaveBeenCalledWith("conference-assets");
    expect(bucketApi.upload).toHaveBeenCalledWith("2026/cfp.pdf", body, options);
    expect(result).toEqual({
      id: "file-id",
      path: "2026/cfp.pdf",
      fullPath: "conference-assets/2026/cfp.pdf",
    });
  });

  it("creates a signed upload URL without allowing overwrite", async () => {
    const { client, from, bucketApi } = createStorageClient();
    const service = createStorageService(client);

    const result = await service.createSignedUploadUrl({
      bucket: "conference-assets",
      path: "2026/cfp.pdf",
      options: { upsert: false },
    });

    expect(from).toHaveBeenCalledWith("conference-assets");
    expect(bucketApi.createSignedUploadUrl).toHaveBeenCalledWith("2026/cfp.pdf", {
      upsert: false,
    });
    expect(result).toEqual({
      signedUrl: "https://storage.example/upload/sign/conference-assets/2026/cfp.pdf?token=abc",
      path: "2026/cfp.pdf",
      token: "abc",
    });
  });

  it("supports signed URLs, public URLs, downloads, listing, and deletion with dynamic buckets", async () => {
    const { client, from, bucketApi } = createStorageClient();
    const service = createStorageService(client);

    await expect(
      service.createSignedUrl({
        bucket: "private-papers",
        path: "accepted/paper.pdf",
        expiresIn: 60,
      }),
    ).resolves.toEqual({ signedUrl: "https://storage.example/signed" });
    expect(bucketApi.createSignedUrl).toHaveBeenCalledWith("accepted/paper.pdf", 60, undefined);

    expect(service.getPublicUrl({ bucket: "public-assets", path: "logo.svg" })).toEqual({
      publicUrl: "https://storage.example/public/2026/cfp.pdf",
    });
    expect(bucketApi.getPublicUrl).toHaveBeenCalledWith("logo.svg", undefined);

    await expect(
      service.downloadFile({ bucket: "private-papers", path: "accepted/paper.pdf" }),
    ).resolves.toBeInstanceOf(Blob);
    expect(bucketApi.download).toHaveBeenCalledWith("accepted/paper.pdf", undefined);

    await expect(
      service.listFiles({ bucket: "conference-assets", prefix: "2026" }),
    ).resolves.toEqual([{ name: "cfp.pdf" }]);
    expect(bucketApi.list).toHaveBeenCalledWith("2026", undefined, undefined);

    await expect(
      service.deleteFiles({ bucket: "conference-assets", paths: ["2026/cfp.pdf"] }),
    ).resolves.toEqual([{ name: "2026/cfp.pdf" }]);
    expect(bucketApi.remove).toHaveBeenCalledWith(["2026/cfp.pdf"]);

    expect(from).toHaveBeenCalledWith("private-papers");
    expect(from).toHaveBeenCalledWith("public-assets");
    expect(from).toHaveBeenCalledWith("conference-assets");
  });

  it("wraps Supabase storage errors with operation and location details", async () => {
    const supabaseError = { message: "Bucket not found" };
    const { client } = createStorageClient({
      upload: vi.fn().mockResolvedValue({ data: null, error: supabaseError }),
    });
    const service = createStorageService(client);

    await expect(
      service.uploadFile({
        bucket: "missing-bucket",
        path: "file.pdf",
        body: "file contents",
      }),
    ).rejects.toMatchObject({
      name: "SupabaseStorageServiceError",
      operation: "upload",
      bucket: "missing-bucket",
      path: "file.pdf",
      cause: supabaseError,
    });

    await expect(
      service.uploadFile({
        bucket: "missing-bucket",
        path: "file.pdf",
        body: "file contents",
      }),
    ).rejects.toBeInstanceOf(SupabaseStorageServiceError);
  });
});

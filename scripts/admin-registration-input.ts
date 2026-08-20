import { createInterface, type Interface as ReadlineInterface } from "node:readline/promises";
import type { Readable, Writable } from "node:stream";

export type AdminRegistrationInput = {
  email: string;
  password: string;
  name: string;
};

export type AdminPromptOptions = {
  hidden?: boolean;
};

export type AdminPrompt = (question: string, options?: AdminPromptOptions) => Promise<string>;

type AdminPromptSession = {
  ask: AdminPrompt;
  close: () => void;
};

type AdminEnv = Record<string, string | undefined> & {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_NAME?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  if (!email) {
    throw new Error("Admin email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Admin email must be a valid email address.");
  }
}

function validatePassword(password: string) {
  if (!password) {
    throw new Error("Admin password is required.");
  }

  if (password.length < 8) {
    throw new Error("Admin password must be at least 8 characters.");
  }
}

async function askHiddenQuestion(rl: ReadlineInterface, output: Writable, question: string) {
  const mutableOutput = output as Writable & {
    write: (...args: unknown[]) => boolean;
  };
  const originalWrite = mutableOutput.write.bind(output);
  let muted = false;

  mutableOutput.write = (...args: unknown[]) => {
    if (muted) {
      const callback = args.findLast((arg): arg is () => void => typeof arg === "function");
      callback?.();
      return true;
    }

    return originalWrite(...args);
  };

  try {
    const answer = rl.question(question);
    muted = true;
    return await answer;
  } finally {
    muted = false;
    mutableOutput.write = originalWrite;
    output.write("\n");
  }
}

export function createAdminPrompt(
  input: Readable = process.stdin,
  output: Writable = process.stdout,
): AdminPromptSession {
  const rl = createInterface({
    input,
    output,
  });

  return {
    ask(question, options) {
      if (options?.hidden) {
        return askHiddenQuestion(rl, output, question);
      }

      return rl.question(question);
    },
    close() {
      rl.close();
    },
  };
}

export async function collectAdminRegistrationInput(
  env: AdminEnv = process.env,
  prompt?: AdminPrompt,
): Promise<AdminRegistrationInput> {
  const promptSession = prompt ? null : createAdminPrompt();
  const ask = prompt ?? promptSession?.ask;

  if (!ask) {
    throw new Error("Unable to initialize admin registration prompt.");
  }

  try {
    const email = normalizeEmail(env.ADMIN_EMAIL || (await ask("Email: ")));
    const password = env.ADMIN_PASSWORD || (await ask("Password: ", { hidden: true }));
    const name = env.ADMIN_NAME?.trim() || "EBISION Admin";

    validateEmail(email);
    validatePassword(password);

    return {
      email,
      password,
      name,
    };
  } finally {
    promptSession?.close();
  }
}

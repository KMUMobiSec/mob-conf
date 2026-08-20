export type CheckInRegistrationSuccessResult = {
  ok: true;
  status: "checked-in" | "already-checked-in";
  registration: {
    id: string;
    name: string;
    email: string | null;
    idNumber: number | null;
    checkedInAt: string;
  };
};

export type CheckInRegistrationResult =
  | CheckInRegistrationSuccessResult
  | { ok: false; error: string };

type CheckedInRegistration = {
  id: string;
  name: string;
  email: string | null;
  idNumber: number | null;
  checkedInAt: Date;
};

function buildCheckInResult(
  status: CheckInRegistrationSuccessResult["status"],
  registration: CheckedInRegistration,
): CheckInRegistrationSuccessResult {
  return {
    ok: true,
    status,
    registration: {
      id: registration.id,
      name: registration.name,
      email: registration.email,
      idNumber: registration.idNumber,
      checkedInAt: registration.checkedInAt.toISOString(),
    },
  };
}

export function buildCheckedInResult(
  registration: CheckedInRegistration,
): CheckInRegistrationSuccessResult {
  return buildCheckInResult("checked-in", registration);
}

export function buildAlreadyCheckedInResult(
  registration: CheckedInRegistration,
): CheckInRegistrationSuccessResult {
  return buildCheckInResult("already-checked-in", registration);
}

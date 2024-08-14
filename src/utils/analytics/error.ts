import { isAxiosError } from "axios";
import { sendAnalyticsEvent, TagProperties } from ".";

const getErrorReason = (e: unknown): string | null => {
  if (
    e &&
    typeof e === "object" &&
    "reason" in e &&
    typeof e.reason === "string"
  ) {
    return e.reason;
  }
  return null;
};

const getErrorType = (error: unknown): string => {
  if (isAxiosError(error)) {
    return "axios_error";
  }
  const reason = getErrorReason(error);
  if (reason && reason.includes("reverted")) {
    return "reverted";
  }
  return "unknown";
};

export const sendAnalyticsError = (error: unknown, data: TagProperties) => {
  const serialized = JSON.stringify(error);
  const type = getErrorType(error);

  sendAnalyticsEvent("error", {
    error: serialized,
    type,
    data,
  });
};

import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";

export const showNotificationFromError = (e: any, baseErrorMessage: string) => {
  const errorReason: string | undefined = e?.message?.data.split(": ").pop();
  const errorMessage = errorReason
    ? `${baseErrorMessage}: ${errorReason}`
    : baseErrorMessage;
  showErrorNotification(errorMessage);
};

export const showErrorNotification = (message: string) => {
  showNotification({
    status: "error",
    message,
  });
};

import { RefObject } from "react";
import {
  closeAllNotifications,
  showNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { createBlobFromDom } from "./createBlobFromDom";
import { TranslationMap } from "../types/translation";

export type CreateFileProps = {
  ref: RefObject<HTMLImageElement> | null;
  t: TranslationMap;
  title: string;
  text?: string;
  fileName: string;
};

type DataProps = {
  files: File[];
  title?: string;
  text?: string;
};

export type CreateFileReturnProps = {
  blob: File;
  data: DataProps;
};

export const createImageDataToShare = async ({
  ref,
  t,
  title,
  text,
  fileName,
}: CreateFileProps): Promise<CreateFileReturnProps | undefined> => {
  if (!ref?.current) return;

  try {
    const blob = await createBlobFromDom(ref, fileName);
    if (!blob) return;

    const data: DataProps = {
      files: [blob],
      title,
      text,
    };
    return {
      blob,
      data,
    };
  } catch (err) {
    console.error(err);

    showNotification({
      message: t.sharePositionBlobErrorMessage,
      status: "error",
    });
  }
};

export const share = async (data: DataProps) => {
  const testShare = { title: "test share" };
  if (!navigator.canShare?.(testShare)) {
    return showNotification({
      message: `sharing unavailable on this browser`,
      status: "error",
    });
  }

  try {
    await navigator.share(data);
  } catch (err) {
    console.error(err);

    closeAllNotifications();
    const isCancelled = JSON.stringify(err).includes("canceled");
    showNotification({
      message: isCancelled
        ? "sharing cancelled"
        : "error sharing position. please try again.",
      status: isCancelled ? "info" : "error",
    });
  }
};

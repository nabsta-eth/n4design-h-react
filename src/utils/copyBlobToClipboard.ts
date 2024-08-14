import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { TranslationMap } from "../types/translation";

export const copyBlobToClipboard = async (blob: File, t: TranslationMap) => {
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);

  showNotification({
    status: "success",
    message: t.shareImageCopiedToClipboard,
  });
};

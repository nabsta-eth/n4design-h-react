import { toBlob } from "html-to-image";

export const createBlobFromDom = async (
  ref: React.RefObject<HTMLElement>,
  fileName?: string,
) => {
  if (!ref.current) return;

  const newFile = await toBlob(ref.current);
  if (!newFile) return;

  const fullFileName = fileName ?? "image.png";

  return new File([newFile], fullFileName, {
    type: "image/png",
  });
};

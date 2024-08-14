import { config } from "../config";

export const onTokenImageLoadError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
) => {
  event.currentTarget.src = config.tokenIconPlaceholderUrl;
};

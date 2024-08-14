import { useEffect } from "react";

export type FallbackComponentProps = {
  error: any;
  resetErrorBoundary: () => void;
};

export const AppError = ({ error }: FallbackComponentProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div
      className="uk-width-expand uk-flex uk-flex-center"
      style={{ marginTop: "calc(50vh - 140px)" }}
    >
      {`how embarrassing! ${error?.message.toLowerCase()}`}
    </div>
  );
};

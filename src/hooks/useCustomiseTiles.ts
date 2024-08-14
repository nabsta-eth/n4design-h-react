import React from "react";

const useCustomiseTiles = () => {
  const [shouldShowCustomise, setShouldShowCustomise] =
    React.useState<boolean>(false);
  return {
    shouldShowCustomise,
    setShouldShowCustomise,
  };
};

export default useCustomiseTiles;

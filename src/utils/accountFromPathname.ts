import { ethers } from "ethers";
import { useLocation } from "react-router-dom";

export const accountFromPathname = () => {
  const pathname = useLocation().pathname;
  const pathnameParts = pathname.split("/");
  const accountFromPathname = pathnameParts.find(p =>
    ethers.utils.isAddress(p),
  );
  return accountFromPathname;
};

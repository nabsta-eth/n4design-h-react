import { useUiStore } from "../context/UserInterface";
import { DesktopProviders } from "./DesktopProviders";
import { MobileProviders } from "./MobileProviders";

export const DesktopOrMobile = () => {
  const { isMobile } = useUiStore();
  return isMobile ? <MobileProviders /> : <DesktopProviders />;
};

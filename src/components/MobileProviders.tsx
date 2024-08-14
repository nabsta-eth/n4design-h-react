import { UiMobileProvider } from "../context/UserInterfaceMobile";
import { NavigationMobile } from "../navigation/NavigationMobile";
import LayoutMobile from "./LayoutMobile";

export const MobileProviders = () => (
  <UiMobileProvider>
    <LayoutMobile>
      <NavigationMobile />
    </LayoutMobile>
  </UiMobileProvider>
);

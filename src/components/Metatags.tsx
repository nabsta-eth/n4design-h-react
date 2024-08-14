import { useUiStore } from "../context/UserInterface";
import { getThemeFile } from "../utils/ui";
import { Helmet } from "react-helmet";

type MetaProps = {
  function: string;
  description: string;
  hideWidget?: boolean;
  customTitle?: string;
};

const Metatags = (props: MetaProps) => {
  const { host } = window.location;
  const { activeTheme } = useUiStore();

  return (
    <Helmet>
      <title>
        {props.customTitle
          ? props.customTitle
          : `handle.fi | ${props.function}`}
      </title>
      <meta
        name="theme-color"
        content={getThemeFile(activeTheme).backgroundColor}
      />
      <meta
        name="msapplication-TileColor"
        content={getThemeFile(activeTheme).backgroundColor}
      />
      <meta name="description" content={`handle.fi ${props.function}`} />
      <meta property="og:title" content={`handle.fi ${props.function}`} />
      <meta property="og:description" content={props.description} />
      <meta
        property="og:image"
        content={`${host}/assets/images/handle.fiLogoChimpNewCut.png`}
      />
      <meta property="twitter:title" content={`handle.fi ${props.function}`} />
      <meta property="twitter:description" content={props.description} />
      <meta
        property="twitter:image"
        content={`${host}/assets/images/handle.fiLogoChimpNewCut.png`}
      />
    </Helmet>
  );
};

export default Metatags;

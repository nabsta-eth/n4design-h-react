import { Grid } from "@handle-fi/react-components/dist/components/handle_uikit/components/Grid";
import { ButtonTabs } from ".";
import classNames from "classnames";
import { useMediaQueries } from "../hooks/useMediaQueries";

type Props<T> = {
  selectedTab: T;
  tabButtons: {
    name: T;
    disabled?: boolean;
    hide?: boolean;
  }[];
  onTabClick: (id: T) => void;
  children: React.ReactNode[];
};

const EarnPoolBase = <T extends string>(props: Props<T>) => {
  const mediaQueries = useMediaQueries();

  return (
    <Grid gutter="medium">
      <div className="uk-width-1-2@m uk-margin-xsmall-top uk-margin-xsmall-bottom">
        <ButtonTabs
          wrapperClassName="uk-width-expand"
          buttonClassName="uk-flex-auto uk-text-nowrap uk-width-auto"
          active={props.selectedTab}
          buttons={props.tabButtons}
          onClick={props.onTabClick}
        />
        <div className="uk-margin-top">{props.children[0]}</div>
      </div>

      <div
        className={classNames("uk-text-left uk-margin-xsmall-bottom", {
          "uk-flex-first": mediaQueries.maxTablet,
          "uk-width-1-2": mediaQueries.minTablet,
        })}
      >
        {props.children[1]}
      </div>
    </Grid>
  );
};

export default EarnPoolBase;

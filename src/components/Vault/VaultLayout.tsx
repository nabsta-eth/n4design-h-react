import * as React from "react";

import { PageTitle } from "..";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import Metatags from "../Metatags";
import classNames from "classnames";
import { Grid } from "@handle-fi/react-components/dist/components/handle_uikit/components/Grid";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import { VaultAction } from "../../types/vault";
import { useLocation } from "react-router-dom";

type Props = {
  title: string;
  action: VaultAction;
  children: React.ReactNode[];
};

// takes two children to be displayed in two columns
// Vault.tsx and Kashi.tsx share a lot more in common but I have decided to
// keep much of the logic and layout in the individual files for flexibility.
// Once stable probably worth moving into here.
const VaultLayout: React.FC<Props> = ({ title, action, children }) => {
  const mediaQueries = useMediaQueries();

  const activePath = useLocation();
  const titleToDisplay = activePath.pathname.startsWith(`/${action}`)
    ? action
    : title;

  return (
    <div>
      <Metatags
        function={`manage vault: ${action}`}
        description={`${
          action === "borrow"
            ? "borrow against collateral"
            : action === "repay"
            ? "repay debt"
            : "withdraw collateral"
        }`}
      />

      <Container className="hfi-container-padding">
        <PageTitle text={titleToDisplay} />

        <Grid gutter="medium" className="uk-flex">
          {/* left */}
          <div
            className={classNames({
              "uk-width-1-1": mediaQueries.maxTablet,
              "uk-width-2-5": mediaQueries.minTablet,
            })}
            style={{
              maxWidth: mediaQueries.maxTablet ? "500px" : undefined,
            }}
          >
            {children[0]}
          </div>

          {/* right */}
          <div
            className={classNames({
              "uk-width-1-1": mediaQueries.maxTablet,
              "uk-width-3-5": mediaQueries.minTablet,
            })}
          >
            {children[1]}
          </div>
        </Grid>
      </Container>
    </div>
  );
};

export default VaultLayout;

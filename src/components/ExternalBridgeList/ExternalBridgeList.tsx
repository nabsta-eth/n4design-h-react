import {
  Table,
  TableBody,
  TableRow,
  TableData,
  TableHead,
  TableHeadData,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";

const ExternalBridgeList = () => {
  return (
    <Table
      id="bridge-list"
      size="xs"
      divider
      className="uk-form-width-large uk-margin-remove-bottom uk-margin-xsmall-top"
    >
      <TableHead>
        <TableRow>
          <TableHeadData>bridge</TableHeadData>
          <TableHeadData>link</TableHeadData>
        </TableRow>
      </TableHead>

      <TableBody>
        <TableRow>
          <TableData>
            <img
              className="uk-margin-small-right"
              height="24"
              width="24"
              src={NETWORK_NAME_TO_LOGO_URL["arbitrum"]}
              alt="arbitrum"
            />
            arbitrum
          </TableData>

          <TableData>
            <a
              href="https://bridge.arbitrum.io/"
              target="_blank"
              rel="noreferrer noopener"
              className="hfi-link"
            >
              arbitrum bridge
              <FontAwesomeIcon
                icon={["far", "external-link"]}
                className="uk-margin-small-left"
              />
            </a>
          </TableData>
        </TableRow>

        <TableRow>
          <TableData>
            <img
              className="uk-margin-small-right"
              height="24"
              width="24"
              src="/assets/images/hopLogo.svg"
              alt="hop protocol"
            />
            hop
          </TableData>

          <TableData>
            <a
              href="https://app.hop.exchange/"
              target="_blank"
              rel="noreferrer noopener"
              className="hfi-link"
            >
              hop protocol
              <FontAwesomeIcon
                icon={["far", "external-link"]}
                className="uk-margin-small-left"
              />
            </a>
          </TableData>
        </TableRow>

        <TableRow>
          <TableData>
            <img
              className="uk-margin-small-right"
              height="24"
              width="24"
              src="/assets/images/jumper.svg"
              alt="jumper"
            />
            jumper
          </TableData>

          <TableData>
            <a
              href="https://jumper.exchange/"
              target="_blank"
              rel="noreferrer noopener"
              className="hfi-link"
            >
              jumper exchange
              <FontAwesomeIcon
                icon={["far", "external-link"]}
                className="uk-margin-small-left"
              />
            </a>
          </TableData>
        </TableRow>

        <TableRow>
          <TableData>
            <img
              className="uk-margin-small-right"
              height="24"
              width="24"
              src="/assets/images/stargate.svg"
              alt="jumper"
            />
            stargate
          </TableData>

          <TableData>
            <a
              href="https://stargate.finance/transfer"
              target="_blank"
              rel="noreferrer noopener"
              className="hfi-link"
            >
              stargate finance
              <FontAwesomeIcon
                icon={["far", "external-link"]}
                className="uk-margin-small-left"
              />
            </a>
          </TableData>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default ExternalBridgeList;

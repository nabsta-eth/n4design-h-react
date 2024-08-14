import { ethers } from "ethers";
import React from "react";
import { Input } from "../components";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";

const ReferralLinkGenerator = () => {
  const [address, setAddress] = React.useState("");
  const referralLink =
    ethers.utils.isAddress(address.toLowerCase()) &&
    Buffer.from(address).toString("base64");

  return (
    <Container size="small">
      <Input
        value={address}
        onChange={setAddress}
        id="generate-reflink-input"
        placeholder="input address"
      />
      <div>
        Referral Link:{" "}
        {referralLink
          ? `${window.location.origin}?ref=${referralLink}`
          : "Invalid Address"}
      </div>
    </Container>
  );
};

export default ReferralLinkGenerator;

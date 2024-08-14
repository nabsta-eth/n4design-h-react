import * as React from "react";
import classNames from "classnames";
import classes from "./MobileChat.module.scss";
import { useNavigate } from "react-router-dom";
import {
  MathisChatBox,
  MATHIS_AUTHOR_NAME,
} from "../MathisChatBox/MathisChatBox";
import { useMathisStore } from "../../context/Mathis";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useInView } from "react-intersection-observer";

const MobileChat: React.FC = () => {
  const navigate = useNavigate();
  const { isChatInputFocussed, setIsChatInputFocussed } = useMathisStore();
  const chatRef = React.createRef<HTMLDivElement>();
  const { ref, inView } = useInView({ threshold: 1 });
  React.useEffect(() => {
    if (chatRef.current && isChatInputFocussed && inView) {
      chatRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
    } else setIsChatInputFocussed(false);
  }, [chatRef.current, isChatInputFocussed, inView]);

  return (
    <div ref={ref}>
      <div
        ref={chatRef}
        className={classNames(classes.chatContainer, {
          [classes.chatContainerFocussed]: isChatInputFocussed,
        })}
      >
        <div
          className={classNames("uk-flex uk-flex-middle", classes.chatHeader)}
        >
          <FontAwesomeIcon
            icon={["far", "chevron-left"]}
            className="uk-margin-small-right"
            onClick={() => navigate(-1)}
          />
          <h4 className="uk-margin-remove-vertical">
            chat with {MATHIS_AUTHOR_NAME}
          </h4>
        </div>

        <MathisChatBox />
      </div>
    </div>
  );
};

export default MobileChat;

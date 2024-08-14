import { createRef, useEffect, useMemo, useState } from "react";
import { ChatMessage, ChatBoxMessage } from "./ChatMessage";
import { Button, Input } from "../index";
import * as React from "react";
import classes from "./ChatBox.module.scss";
import ColouredScrollbars from "../ColouredScrollbars";
import { MATHIS_AUTHOR_NAME } from "../MathisChatBox/MathisChatBox";
import classNames from "classnames";
import { useUiStore } from "../../context/UserInterface";
import { useLanguageStore } from "../../context/Translation";
import { useMathisStore } from "../../context/Mathis";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

const USER_AUTHOR_NAME = "you";

type Props = {
  onSubmitMessage: (content: ChatBoxMessage) => void;
  messages: ChatBoxMessage[];
};

export const ChatBox = ({ onSubmitMessage, messages }: Props) => {
  const { isMobile } = useUiStore();
  const { isChatInputFocussed, setIsChatInputFocussed } = useMathisStore();
  const { t } = useLanguageStore();
  const [input, setInput] = useState("");
  const renderedMessages = useMemo(
    () =>
      messages.map((message, i) => <ChatMessage key={i} message={message} />),
    [messages],
  );

  const inputRef = React.createRef<HTMLInputElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();

  const handleSubmitInternal = () => {
    inputRef?.current?.focus();
    const content = input.trim();
    if (content === "") {
      return;
    }
    const message: ChatBoxMessage = {
      id: `user-msg-${Date.now()}`,
      author: USER_AUTHOR_NAME,
      content,
      date: Date.now(),
    };
    onSubmitMessage(message);
    setInput("");
    scrollRef?.current?.scrollIntoView({ block: "end" });
  };

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    handleSubmitInternal();
  };

  React.useEffect(() => {
    setIsChatInputFocussed(
      document.activeElement === inputRef?.current ||
        document.activeElement === buttonRef?.current,
    );
  }, [document.activeElement, inputRef?.current, buttonRef?.current]);

  const mobileScrollRef = createRef<HTMLDivElement>();
  const scrollRef = createRef<HTMLDivElement>();
  useEffect(() => {
    scrollRef?.current?.scrollIntoView({ block: "end" });
  }, [renderedMessages]);

  useEffect(() => {
    if (isMobile) mobileScrollRef?.current?.scrollIntoView({ block: "end" });
  }, [renderedMessages]);

  return (
    <div
      className={classNames(classes.wrapper, {
        [classes.wrapperMobile]: isMobile,
      })}
    >
      <div
        className={classNames(classes.messages, {
          [classes.messagesMobile]: isMobile,
          [classes.messagesMobileInputFocussed]:
            isMobile && isChatInputFocussed,
        })}
      >
        <ColouredScrollbars
          universal
          style={{
            flexGrow: "1",
            display: "flex",
          }}
        >
          {renderedMessages.length === 0 && <PlaceholderEmptyChatMessage />}
          <div ref={scrollRef}>{renderedMessages}</div>
        </ColouredScrollbars>
      </div>

      <div
        className={classNames(classes.input, {
          [classes.inputMobile]: isMobile,
          [classes.inputMobileFocussed]: isMobile && isChatInputFocussed,
        })}
      >
        <Input
          id="chat-input"
          ref={inputRef}
          placeholder={`chat with ${MATHIS_AUTHOR_NAME}`}
          value={input}
          rightComponent={
            <Button
              ref={buttonRef}
              className="hfi-input-button uk-margin-small-left"
              onClick={handleSubmitInternal}
            >
              <FontAwesomeIcon icon={["far", "paper-plane-top"]} />
            </Button>
          }
          onChange={value => setInput(value)}
          onKeyDown={handleSubmit}
        />
        <div className="uk-flex uk-flex-right uk-width-expand uk-text-small">
          <a
            className="hfi-link"
            href="https://mathis.global"
            target="_blank"
            rel="noreferrer"
          >
            powered by mathisAI
          </a>

          <span className="hfi-warning uk-flex uk-flex-middle uk-margin-small-left">
            <FontAwesomeIcon
              className={classNames("hfi-warning", classes.betaIcon)}
              icon={["fal", "exclamation-triangle"]}
            />
            <span className="hfi-warning uk-margin-xsmall-left uk-margin-small-right">
              {t.beta}
            </span>
          </span>
        </div>

        <div ref={mobileScrollRef} />
      </div>
    </div>
  );
};

const PlaceholderEmptyChatMessage = () => (
  <div
    style={{
      textAlign: "center",
      flex: "1",
    }}
    className="uk-margin-xsmall-top"
  >
    <i>say hi to trooper {MATHIS_AUTHOR_NAME}...</i>
  </div>
);

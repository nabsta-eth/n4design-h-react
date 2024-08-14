import { MessageDelta } from "@mathis-global/mathis-sdk";
import { useReducer } from "react";
import { useMathis, useMathisStore } from "../../context/Mathis";
import { ChatBox, ChatBoxMessage } from "@handle-fi/react-components";
import classes from "./MathisChatBox.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import classNames from "classnames";
import { useLanguageStore } from "../../context/Translation";
import Blockies from "react-blockies";
import { getThemeFile } from "../../utils/ui";
import { useUiStore } from "../../context/UserInterface";

export const MATHIS_AUTHOR_NAME = "zAIus";
export const USER_AUTHOR_NAME = "you";
export const USER_MESSAGE_ID_PREFIX = "usr-msg-";

const createMathisMessage = ({
  id,
  content,
}: MessageDelta): ChatBoxMessage => ({
  id,
  content,
  author: MATHIS_AUTHOR_NAME,
  date: Date.now(),
  isRightAligned: true,
});

export const MathisChatBox = () => {
  const { sendUserInput } = useMathis({
    onMessageReceived: delta => {
      dispatchMessage({
        type: "upsert",
        message: createMathisMessage(delta),
      });
    },
  });

  const { t } = useLanguageStore();
  const [messages, dispatchMessage] = useReducer(messageReducer, []);
  const { activeTheme } = useUiStore();
  const { setIsChatInputFocussed } = useMathisStore();

  const mathisIcon = (
    <div className={classes.imageWrapper}>
      <img
        src="assets/images/zAIus.png"
        width="20"
        alt={MATHIS_AUTHOR_NAME}
        className={classes.messageImage}
      />
    </div>
  );
  const userIcon = (
    <div className={classes.imageWrapper}>
      <Blockies
        seed="this is a more complex seed to make the blocky more interesting"
        bg={getThemeFile(activeTheme).primaryColor}
        fg={getThemeFile(activeTheme).backgroundColor}
        spotColor={getThemeFile(activeTheme).errorColor}
        size={6}
        className={classes.identicon}
      />
    </div>
  );

  const handleSubmit = (content: string) => {
    dispatchMessage({
      type: "upsert",
      message: {
        id: `${USER_MESSAGE_ID_PREFIX}${Date.now()}`,
        author: USER_AUTHOR_NAME,
        date: Date.now(),
        isRightAligned: false,
        content,
      },
    });
    sendUserInput(content);
  };
  return (
    <div className="uk-flex uk-flex-column uk-flex-1 uk-height-1-1">
      <ChatBox
        classes={classes}
        header={
          messages.length === 0
            ? `say hi to trooper ${MATHIS_AUTHOR_NAME}...`
            : ""
        }
        handleSubmit={handleSubmit}
        messages={messages}
        inputPlaceholder={`chat with ${MATHIS_AUTHOR_NAME}`}
        mathisIcon={mathisIcon}
        userIcon={userIcon}
        userAuthorName={USER_AUTHOR_NAME}
        isMultiLine
        setIsChatInputFocussed={setIsChatInputFocussed}
      />

      <div
        className={classNames(
          "uk-flex uk-flex-right uk-width-expand uk-text-small",
          classes.beta,
        )}
      >
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
          <span className="hfi-warning uk-margin-xsmall-left">{t.beta}</span>
        </span>
      </div>
    </div>
  );
};

type MessageAction = {
  type: "upsert";
  message: ChatBoxMessage;
};

const messageReducer = (
  state: ChatBoxMessage[],
  action: MessageAction,
): ChatBoxMessage[] => {
  switch (action.type) {
    case "upsert":
      const existingMessage = state.find(m => m.id === action.message.id);
      if (!existingMessage) {
        // Insert message.
        return [...state, action.message];
      }
      // Update message using delta; append to existing message content.
      return [
        ...state.map(m =>
          m.id !== action.message.id
            ? m
            : {
                ...m,
                content: `${m.content}${action.message.content}`,
              },
        ),
      ];
    default:
      console.error("messageReducer: invalid action", action);
      return state;
  }
};

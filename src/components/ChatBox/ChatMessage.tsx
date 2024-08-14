import classes from "./ChatMessage.module.scss";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import { getThemeFile } from "../../utils/ui";
import Blockies from "react-blockies";
import { useUiStore } from "../../context/UserInterface";
import { MATHIS_AUTHOR_NAME } from "../MathisChatBox/MathisChatBox";
import { useMemo } from "react";

export type ChatBoxMessage = {
  id: string;
  content: string;
  author: string;
  date: number;
};

type Props = {
  message: ChatBoxMessage;
};

export const ChatMessage = ({ message }: Props) => {
  const { activeTheme } = useUiStore();
  const paragraphs = useMemo(
    () =>
      message.content.split("\n").map((content, i) => (
        <span key={i}>
          {content}
          <br />
        </span>
      )),
    [message.content],
  );
  return (
    <div className={classes.message}>
      <div className={classes.imageWrapper}>
        {message.author === MATHIS_AUTHOR_NAME ? (
          <Image
            src="assets/images/zAIus.png"
            alt={MATHIS_AUTHOR_NAME}
            className={classes.messageImage}
          />
        ) : (
          <Blockies
            seed="this is a more complex seed to make the blocky more interesting"
            bg={getThemeFile(activeTheme).primaryColor}
            fg={getThemeFile(activeTheme).backgroundColor}
            spotColor={getThemeFile(activeTheme).errorColor}
            size={6}
            className={classes.identicon}
          />
        )}
      </div>
      <div className={classes.contentWrapper}>
        <div className={classes.author}>{message.author}</div>
        <div className={classes.content}>{paragraphs}</div>
      </div>
    </div>
  );
};

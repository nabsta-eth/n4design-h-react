import { ConfettiExplosion } from "@handle-fi/react-components/dist/components/confetti";
import classes from "./TiprConfetti.module.scss";
import { useUiStore } from "../../../context/UserInterface";
import classNames from "classnames";

type Props = {
  duration?: number;
  repeats?: number;
};

const DEFAULT_DURATION = 5000;
const DEFAULT_REPEATS = 1;

export const TiprConfetti = ({ duration, repeats }: Props) => {
  const { isMobile } = useUiStore();
  const widthFactor = isMobile ? 1.75 : 1.25;
  const repeatsInternal = repeats ?? DEFAULT_REPEATS;
  const confettiProps = {
    force: 1,
    duration: duration ?? DEFAULT_DURATION,
    repeats: repeatsInternal,
    particleCount: 150,
    particleSize: 50,
    width: widthFactor * window.innerWidth,
    height: isMobile ? window.innerHeight * 2 : undefined,
    zIndex: 9999,
    images: [
      "/assets/images/banana.png",
      "/assets/images/grillzOrange.png",
      "/assets/images/handle.fiDancingGorilla.gif",
      "/assets/images/fireworks.png",
      "/assets/images/partyHat.png",
    ],
  };

  return (
    <>
      <div
        className={classNames(classes.tiprConfettiLeft, {
          [classes.tiprConfettiLeftMobile]: isMobile,
        })}
      >
        <ConfettiExplosion {...confettiProps} />
      </div>
      {!isMobile && (
        <div className={classes.tiprConfettiRight}>
          <ConfettiExplosion {...confettiProps} />
        </div>
      )}
    </>
  );
};

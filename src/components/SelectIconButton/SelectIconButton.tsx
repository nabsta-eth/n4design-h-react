import {
  createRef,
  useMemo,
  SyntheticEvent,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { Dropdown } from "@handle-fi/react-components/dist/components/handle_uikit/components/Dropdown";
import "./selectIconButton.scss";
import classNames from "classnames";
import UIkit from "uikit";
import classes from "./SelectIconButton.module.scss";
import { themeFile } from "../../utils/ui";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";
import { config } from "../../config";
import {
  DisplayOption,
  DisplayOptions,
  SelectOption,
} from "../../types/select";
import { onSelectDropdownKeyDownInternal } from "../../utils/select";

export type Props<T> = {
  id: string;
  containerId?: string;
  options: SelectOption<T>[];
  wrapperClassName?: string;
  disabled?: boolean;
  dropdownPosition?: string;
  dropdownOffset?: string;
  size?: string;
  isSelected: (item: T) => boolean;
  onChange: (newValue: T) => void;
  onImageLoadError?: (e: SyntheticEvent<HTMLImageElement, Event>) => void;
  showSelected?: boolean;
  enableSelected?: boolean;
  maxDisplayOptions?: number;
  showIconRight?: boolean;
  dropdownClassName?: string;
};

const SelectIconButton = <T extends string>({
  id,
  containerId,
  options,
  disabled,
  wrapperClassName,
  dropdownPosition,
  dropdownOffset,
  size,
  isSelected,
  onChange,
  onImageLoadError,
  showSelected,
  enableSelected,
  maxDisplayOptions,
  showIconRight,
  dropdownClassName,
}: Props<T>) => {
  const searchRef = createRef<HTMLInputElement>();
  const boundaryClass = `${id}-boundary`;
  const wrapperId = `${id}-wrapper`;
  const dropdownId = `${id}-dropdown`;
  dropdownPosition = dropdownPosition ?? "bottom-justify";
  dropdownOffset =
    dropdownOffset ??
    (-Number(themeFile.borderWidth.replace("px", ""))).toString();
  const positionString = `pos: ${dropdownPosition};`;
  const containerString = containerId ? `container: #${containerId}; ` : "";

  const onChangeInternal = (
    event: ReactMouseEvent<HTMLButtonElement>,
    value: T,
  ) => {
    event.preventDefault();
    onChange(value);
    UIkit.dropdown(`#${dropdownId}.uk-dropdown`).hide();
  };

  const selected = useMemo(
    () => options.find(option => isSelected(option.item)),
    [options, isSelected],
  );

  const displayOptions: DisplayOptions<T> = options
    .filter(
      option =>
        !option.hidden && (option.item !== selected?.item || showSelected),
    )
    .slice(0, maxDisplayOptions)
    .map(displayOption => {
      return {
        ...displayOption,
        ref: createRef<HTMLButtonElement>(),
      };
    });

  const buttonHeight = size === "small" ? 32 : 36;
  const fontAndImgSize = buttonHeight - 12;

  return (
    <>
      <Button
        id={wrapperId}
        className={classNames(wrapperClassName, boundaryClass)}
        icon
        type="secondary"
        disabled={disabled}
      >
        <span>
          {selected?.icon?.type === "icon" && (
            <FontAwesomeIcon
              style={{ fontSize: `${fontAndImgSize}px` }}
              icon={["far", selected?.icon.value]}
            />
          )}

          {selected?.icon?.type === "image" && (
            <img
              height={fontAndImgSize}
              width={fontAndImgSize}
              style={{ height: fontAndImgSize, width: fontAndImgSize }}
              src={selected?.icon.value}
              alt={String(selected?.item)}
              onError={onImageLoadError}
            />
          )}

          {selected?.icon?.type === "spritesheet" && (
            <SpritesheetIcon
              sizePx={fontAndImgSize}
              iconName={selected.icon.value}
              style={{ marginTop: 0 }}
              fallbackSrc={config.tokenIconPlaceholderUrl}
            />
          )}
        </span>
      </Button>

      <Dropdown
        id={dropdownId}
        className={classNames(
          "uk-dropdown",
          dropdownClassName,
          dropdownPosition,
        )}
        options={`${containerString}mode: click; toggle: #${wrapperId}; delay-hide: 0; ${positionString} boundary: .${boundaryClass}; offset: ${dropdownOffset};`}
      >
        {displayOptions.length > 0 && (
          <ul className="uk-nav uk-dropdown-nav">
            {displayOptions.map((option: DisplayOption<T>, i: number) => (
              <DropdownOption
                option={option}
                key={option.item}
                i={i}
                item={option.item}
                selected={selected}
                enableSelected={enableSelected}
                buttonHeight={buttonHeight}
                size={size}
                onChangeInternal={onChangeInternal}
                onKeyDownInternal={e =>
                  onSelectDropdownKeyDownInternal<T>(
                    e,
                    displayOptions,
                    selected,
                    searchRef,
                  )
                }
                fontAndImgSize={fontAndImgSize}
                onImageLoadError={onImageLoadError}
                showIconRight={showIconRight}
              />
            ))}
          </ul>
        )}
      </Dropdown>
    </>
  );
};

type DropdownOptionProps<T> = DisplayOption<T> & {
  i: number;
  option: DisplayOption<T>;
  selected: SelectOption<T> | undefined;
  enableSelected?: boolean;
  buttonHeight: number;
  size?: string;
  fontAndImgSize: number;
  useImageBackground?: boolean;
  isSearch?: boolean;
  onImageLoadError?: (e: SyntheticEvent<HTMLImageElement, Event>) => void;
  onChangeInternal: (
    event: ReactMouseEvent<HTMLButtonElement>,
    value: T,
  ) => void;
  onKeyDownInternal: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  showIconRight?: boolean;
};

const DropdownOption = <T extends string>({
  option,
  i,
  selected,
  enableSelected,
  buttonHeight,
  size,
  onChangeInternal,
  onKeyDownInternal,
  fontAndImgSize,
  onImageLoadError,
  useImageBackground,
  isSearch,
  showIconRight,
}: DropdownOptionProps<T>) => {
  const isOptionDisabled =
    option.disabled || (!enableSelected && option.label === selected?.label);
  const classnames = classNames(
    option.label?.replace("/", "-"),
    "uk-button-default uk-width-expand uk-flex uk-flex-between uk-flex-middle",
    classes.withIcon,
    {
      "uk-active": option.label === selected?.label,
    },
  );

  return (
    <li>
      <Button
        className={classNames(classnames)}
        size={size}
        style={{
          height: `${buttonHeight}px`,
        }}
        disabled={isOptionDisabled}
        onClick={
          isOptionDisabled
            ? undefined
            : (event: ReactMouseEvent<HTMLButtonElement>) =>
                onChangeInternal(event, option.item)
        }
        onKeyDown={isOptionDisabled ? undefined : onKeyDownInternal}
        ref={option.ref}
      >
        <span className="uk-flex uk-flex-middle uk-width-expand uk-flex-between">
          {showIconRight && (
            <span className="uk-flex uk-flex-right uk-width-expand uk-margin-small-right">
              {option.label}
            </span>
          )}

          {option?.icon?.type === "icon" && (
            <FontAwesomeIcon
              style={{
                fontSize: `${fontAndImgSize}px`,
              }}
              icon={["far", option.icon.value]}
            />
          )}

          {option.icon?.type === "image" && (
            <img
              height={fontAndImgSize}
              width={fontAndImgSize}
              style={{
                height: fontAndImgSize,
                width: fontAndImgSize,
                margin: showIconRight ? 0 : undefined,
              }}
              src={option.icon.value}
              alt={String(option.item)}
              onError={onImageLoadError}
              className={classNames({
                [classes.imageBackground]: useImageBackground,
              })}
            />
          )}

          {option.icon?.type === "spritesheet" && (
            <SpritesheetIcon
              sizePx={fontAndImgSize}
              iconName={option.icon.value}
              style={{ marginTop: 0 }}
              className={classNames(classes.dropdownSpritesheetIcon, {
                [classes.imageBackground]:
                  useImageBackground && option.item !== "FOREX",
              })}
              fallbackSrc={config.tokenIconPlaceholderUrl}
            />
          )}

          {!showIconRight && option.label}
        </span>
        {option.rightLabel && (
          <span className="dropdown-label">{option.rightLabel}</span>
        )}
      </Button>
    </li>
  );
};

export default SelectIconButton;

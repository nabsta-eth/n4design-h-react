import {
  createRef,
  forwardRef,
  useEffect,
  useMemo,
  useState,
  SyntheticEvent,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ChangeEvent as ReactChangeEvent,
} from "react";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { Dropdown } from "@handle-fi/react-components/dist/components/handle_uikit/components/Dropdown";
import "./select.scss";
import classNames from "classnames";
import ColouredScrollbars from "../ColouredScrollbars";
import UIkit from "uikit";
import classes from "./Select.module.scss";
import { Pair } from "handle-sdk/dist/types/trade";
import { pairFromString, pairToString } from "handle-sdk/dist/utils/general";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import { themeFile } from "../../utils/ui";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
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
  label?: string;
  options: SelectOption<T>[];
  wrapperClassName?: string;
  disabled?: boolean;
  dropdownPosition?: string;
  dropdownOffset?: string;
  expand?: boolean;
  size?: string;
  width?: number;
  isSelected: (item: T) => boolean;
  onChange: (newValue: T) => void;
  search?: {
    value: string;
    placeholder: string;
    onChange: (search: string) => void;
    showClearButton?: boolean;
  };
  showInputAsSearch?: boolean;
  onImageLoadError?: (e: SyntheticEvent<HTMLImageElement, Event>) => void;
  showSelected?: boolean;
  market?: boolean;
  enableSelected?: boolean;
  isInlineDisplay?: boolean;
  maxDisplayOptions?: number;
  useImageBackground?: boolean;
  hideChevronUntilHovered?: boolean;
};

const Select = <T extends string>({
  id,
  label,
  options,
  disabled,
  wrapperClassName,
  dropdownPosition,
  dropdownOffset,
  expand,
  size,
  width,
  search,
  isSelected,
  onChange,
  onImageLoadError,
  showSelected,
  market,
  enableSelected,
  isInlineDisplay,
  maxDisplayOptions,
  useImageBackground,
  showInputAsSearch,
  hideChevronUntilHovered,
}: Props<T>) => {
  const [open, setOpen] = useState(false);
  const searchRef = createRef<HTMLInputElement>();
  const boundaryClass = `${id}-boundary`;
  const wrapperId = `${id}-wrapper`;
  const dropdownId = `${id}-dropdown`;
  dropdownPosition = dropdownPosition ?? "bottom-justify";
  dropdownOffset =
    dropdownOffset ??
    (search && !showInputAsSearch
      ? "-40"
      : (-Number(themeFile.borderWidth.replace("px", ""))).toString());
  const positionString = `pos: ${dropdownPosition};`;

  UIkit.util.on("#" + dropdownId + ".uk-dropdown", "show", () => {
    setOpen(true);
  });
  UIkit.util.on("#" + dropdownId + ".uk-dropdown", "hide", () => {
    setOpen(false);
  });

  const onChangeInternal = (
    event: ReactMouseEvent<HTMLButtonElement>,
    value: T,
  ) => {
    event.preventDefault();
    onChange(value);
    setOpen(false);
    UIkit.dropdown(`#${dropdownId}.uk-dropdown`).hide();
  };

  const selected = useMemo(
    () => options.find(option => isSelected(option.item)),
    [options, isSelected],
  );

  const displayOptions: DisplayOptions<T> = options
    .filter(
      option =>
        !option.hidden &&
        (search || option.item !== selected?.item || showSelected),
    )
    .slice(0, maxDisplayOptions)
    .map(displayOption => {
      return {
        ...displayOption,
        ref: createRef<HTMLButtonElement>(),
      };
    });

  useEffect(() => {
    if (searchRef.current) {
      return searchRef.current.focus();
    }
    displayOptions
      .filter(option => option.item !== selected?.item)[0]
      ?.ref?.current?.focus();
  }, [searchRef.current, search?.value, open]);

  const buttonHeight = size === "small" ? 32 : 36;
  const fontAndImgSize = buttonHeight - 12;
  const ukFormIconSize = buttonHeight + 4;
  const scrollContainerHeight =
    (displayOptions.length + (displayOptions.length === 0 ? 1 : 0)) *
    buttonHeight;

  const scrollContainerMinimumHeight = Math.min(
    scrollContainerHeight,
    5 * buttonHeight,
  );

  const onSearchFocus = () => {
    if (displayOptions.length > 0) {
      UIkit.dropdown(`#${dropdownId}.uk-dropdown`).show();
    }
  };

  return (
    <div
      id={wrapperId}
      className={classNames(
        "uk-flex",
        "uk-flex-column",
        "hfi-select",
        wrapperClassName,
        boundaryClass,
        {
          "uk-width-expand": expand,
          "hfi-select-small": size === "small",
          "uk-margin-small-left": isInlineDisplay,
          "uk-margin-small-right": isInlineDisplay,
          "uk-display-inline": isInlineDisplay,
        },
      )}
      style={{ width: width && !expand ? `${width}px` : "unset" }}
    >
      {showInputAsSearch && search && (
        <Search
          ref={searchRef}
          displayOptions={displayOptions}
          showInputAsSearch
          search={search}
          key={search.value}
          onSearchFocus={onSearchFocus}
          selected={selected}
        />
      )}
      {(!showInputAsSearch || !search) && (
        <>
          {label && <label>{label}</label>}
          <div className="hfi-select uk-inline" tabIndex={-1}>
            {!disabled && (
              <span
                className={classNames(
                  "uk-form-icon uk-form-icon-flip",
                  classes.chevron,
                  {
                    [classes.hideChevron]: hideChevronUntilHovered,
                  },
                )}
              >
                <FontAwesomeIcon
                  key={open ? "open" : "closed"}
                  icon={["far", `${open ? "chevron-up" : "chevron-down"}`]}
                />
              </span>
            )}

            {selected && market && (
              <MarketPair pair={pairFromString(selected?.label ?? "")} />
            )}

            {selected?.icon && !market && (
              <span
                className="uk-form-icon"
                style={{ width: `${ukFormIconSize}px` }}
              >
                {selected.icon.type === "icon" && (
                  <FontAwesomeIcon
                    style={{ fontSize: `${fontAndImgSize}px` }}
                    icon={["far", selected.icon.value]}
                  />
                )}

                {selected.icon.type === "image" && (
                  <img
                    height={fontAndImgSize}
                    width={fontAndImgSize}
                    style={{ height: fontAndImgSize, width: fontAndImgSize }}
                    src={selected.icon.value}
                    alt={String(selected.item)}
                    className={classNames("img-border", {
                      [classes.imageBackground]:
                        useImageBackground && selected.item !== "FOREX",
                    })}
                    onError={onImageLoadError}
                  />
                )}

                {selected.icon.type === "spritesheet" && (
                  <SpritesheetIcon
                    sizePx={fontAndImgSize}
                    iconName={selected.icon.value}
                    style={{ marginTop: 0 }}
                    className={classNames("img-border", {
                      [classes.imageBackground]:
                        useImageBackground && selected.item !== "FOREX",
                    })}
                    fallbackSrc={config.tokenIconPlaceholderUrl}
                  />
                )}
              </span>
            )}

            {selected && market && selected.rightLabel && (
              <span
                className={classNames(classes.selectLabel, "select-label", {
                  [classes.hiddenChevron]: hideChevronUntilHovered,
                })}
              >
                {selected.rightLabel}
              </span>
            )}

            <input
              disabled={disabled}
              className={classNames("uk-input uk-text-left", {
                [`uk-button-small`]: size === "small",
                "market-select": market,
                [classes.marketInput]: market,
              })}
              type="button"
              value={selected?.label ?? ""}
              style={selected?.icon ? undefined : { paddingLeft: "10px" }}
              data-test={selected?.label}
            />
          </div>
        </>
      )}

      <Dropdown
        id={dropdownId}
        className={classNames("uk-dropdown", dropdownPosition, {
          [`border-top`]: search,
        })}
        options={`mode: click; delay-hide: 0; ${positionString} boundary: .${boundaryClass}; boundary-align: true; offset: ${dropdownOffset};`}
      >
        {!showInputAsSearch && search && (
          <Search
            ref={searchRef}
            displayOptions={displayOptions}
            search={search}
            key={search.value}
            showInputAsSearch
            selected={selected}
          />
        )}

        <ColouredScrollbars
          style={{
            height: `${
              displayOptions.length === 0 ? 0 : scrollContainerMinimumHeight
            }px`,
          }}
        >
          {displayOptions.length > 0 && (
            <ul className="uk-nav uk-dropdown-nav">
              {displayOptions.map((option: DisplayOption<T>, i: number) => (
                <DropdownOption
                  option={option}
                  key={option.item}
                  i={i}
                  item={option.item}
                  market={market}
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
                  useImageBackground={useImageBackground}
                  isSearch={!!search}
                />
              ))}
            </ul>
          )}
        </ColouredScrollbars>
      </Dropdown>
    </div>
  );
};

type MarketPairProps = {
  pair: Pair;
  className?: string;
};

const MarketPair = ({ pair, className }: MarketPairProps) => {
  const instrument = useInstrumentOrThrow(pairToString(pair));
  return (
    <div
      className={classNames(
        "uk-flex uk-flex-middle uk-form-icon",
        classes.pairWrapper,
        className,
      )}
    >
      <PairDisplay pair={pair} size="24" noAssets instrument={instrument} />
    </div>
  );
};

type DropdownOptionProps<T> = DisplayOption<T> & {
  i: number;
  option: DisplayOption<T>;
  market?: boolean;
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
};

const DropdownOption = <T extends string>({
  option,
  i,
  market,
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
}: DropdownOptionProps<T>) => {
  const isOptionDisabled =
    option.disabled || (!enableSelected && option.label === selected?.label);
  return (
    <li>
      <Button
        className={`${option.label?.replace(
          "/",
          "-",
        )} uk-button-default uk-width-expand uk-flex uk-flex-between uk-flex-middle ${
          option.icon ? "with-icon" : ""
        } ${option.label === selected?.label ? "uk-active" : ""}`}
        size={size}
        style={{
          height: `${buttonHeight}px`,
          paddingLeft: market ? 0 : undefined,
          paddingRight: isSearch ? 4 : undefined,
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
        <span className="uk-flex uk-flex-middle">
          {market && (
            <MarketPair
              pair={pairFromString(option.label || "")}
              className={classes.dropdownPairWrapper}
            />
          )}

          {!market && option?.icon?.type === "icon" && (
            <FontAwesomeIcon
              style={{
                fontSize: `${fontAndImgSize}px`,
              }}
              icon={["far", option.icon.value]}
            />
          )}

          {!market && option.icon?.type === "image" && (
            <img
              height={fontAndImgSize}
              width={fontAndImgSize}
              style={{
                height: fontAndImgSize,
                width: fontAndImgSize,
              }}
              src={option.icon.value}
              alt={String(option.item)}
              onError={onImageLoadError}
              className={classNames({
                [classes.imageBackground]: useImageBackground,
              })}
            />
          )}

          {!market && option.icon?.type === "spritesheet" && (
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

          {option.label}
        </span>
        {option.rightLabel && (
          <span className="dropdown-label">{option.rightLabel}</span>
        )}
      </Button>
    </li>
  );
};

type SearchProps<T> = {
  displayOptions: DisplayOptions<T>;
  showInputAsSearch?: boolean;
  onSearchFocus?: () => void;
  search: {
    value: string;
    placeholder: string;
    onChange: (search: string) => void;
    showClearButton?: boolean;
  };
  selected: SelectOption<T> | undefined;
};

const Search = forwardRef<HTMLInputElement, SearchProps<string>>(
  (props, ref) => {
    return (
      <div
        className={classNames(
          "uk-search uk-flex uk-flex-middle",
          classes.searchWrapper,
          {
            [classes.noBorderBottom]:
              props.displayOptions.length === 0 || props.showInputAsSearch,
          },
        )}
      >
        <span className="uk-search-icon-flip">
          <FontAwesomeIcon
            icon={["far", "search"]}
            className={classNames("fa-icon", {
              "uk-margin-small-left": !props.showInputAsSearch,
              [classes.searchIconShift]: props.showInputAsSearch,
            })}
          />
        </span>

        <input
          ref={ref}
          className={classNames(
            "uk-input uk-search-input",
            classes[`searchInput${themeFile.borderWidth.replace("px", "")}`],
            {
              [classes.searchInputShift]: props.showInputAsSearch,
            },
          )}
          type="search"
          placeholder={props.search.placeholder}
          value={props.search.value}
          onChange={(event: ReactChangeEvent<HTMLInputElement>) =>
            props.search.onChange(event.target.value)
          }
          onFocus={props.onSearchFocus}
          onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
            if (e.key === "ArrowDown") {
              const focussedOption =
                props.displayOptions[
                  props.selected?.label === props.displayOptions[0].label
                    ? 1
                    : 0
                ].ref?.current;
              focussedOption?.focus();
            }
          }}
        />

        {props.search.value && props.search.showClearButton && (
          <Button
            icon
            className="uk-form-icon uk-form-icon-flip hfi-input-button"
            style={{ marginRight: -2, marginTop: -4 }}
            onClick={() => props.search.onChange("")}
            uk-tooltip="title: clear search; position: top"
          >
            <FontAwesomeIcon icon={["far", "times"]} className="fa-icon" />
          </Button>
        )}
      </div>
    );
  },
);

export default Select;

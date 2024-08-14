import classNames from "classnames";
import Button from "../Button";

type NavbarProps = {
  onNavigate: (route: string) => void;
  routes: string[];
  selectedRoute: string | undefined;
  className?: string;
};

const Navbar = ({
  onNavigate,
  routes,
  selectedRoute,
  className,
}: NavbarProps) => {
  const buttons = routes.map(route => (
    <Button
      id={route.replace(" ", "-").toLowerCase()}
      key={route}
      size="small"
      className={classNames(
        className,
        "uk-margin-small-right uk-margin-small-bottom",
      )}
      disabled={route === selectedRoute}
      onClick={() => onNavigate(route)}
    >
      {route}
    </Button>
  ));
  return <div>{buttons}</div>;
};

export default Navbar;

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "../context/AuthContext";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  GroupIcon,
  TimeIcon,
  DollarLineIcon,
  PencilIcon,
  FileIcon,
  TableIcon,
  PaperPlaneIcon,
} from "../icons";

type SubNavItem = {
  name: string;
  path?: string;
  pro?: boolean;
  new?: boolean;
  subItems?: SubNavItem[];
  allowedEmploymentTypes?: string[];
  roles?: string[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles: string[];
  subItems?: SubNavItem[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
    roles: ["Manager", "Admin", "User"],
  },
  {
    icon: <FileIcon />,
    name: "To Do",
    path: "/todo",
    roles: ["Manager", "Admin"],
  },
  {
    icon: <GroupIcon />,
    name: "WorkForce",
    path: "/workforce",
    roles: ["Manager", "Admin"],
  },
  {
    icon: <PaperPlaneIcon />,
    name: "Leaves",
    path: "/leaves",
    roles: ["Manager", "Admin", "User"],
  },
  {
    icon: <TimeIcon />,
    name: "Hours",
    roles: ["Manager", "Admin", "User"],
    subItems: [
      {
        name: "All Shifts",
        path: "/hours/all-shifts",
        roles: ["Admin"],
      },
      {
        name: "Open Shifts",
        path: "/hours/open-shifts",
        allowedEmploymentTypes: ["Open-Shifts"],
      },
      {
        name: "Regular Shifts",
        path: "/hours/regular-shifts",
        allowedEmploymentTypes: ["Regular"],
      },
      {
        name: "Part Time",
        path: "/hours/part-time-shifts",
        allowedEmploymentTypes: ["Part-Time"],
      },
      {
        name: "Apprenticeship",
        path: "/hours/apprenticeship-shifts",
        allowedEmploymentTypes: ["Apprenticeship"],
      },
      {
        name: "Absent",
        path: "/hours/absent",
        allowedEmploymentTypes: ["Regular", "Open-Shifts", "Part-Time", "Apprenticeship"],
      },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Pay Check",
    path: "/paycheck",
    roles: ["Manager", "Admin", "User"],
    subItems: [
      {
        name: "Pay Slip",
        path: "/paycheck/payslip",
      },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Shifts",
    roles: ["Manager", "Admin", "User"],
    subItems: [
      { name: "Calendar", path: "/calendar", pro: false },
    ],
  },
  {
    icon: <PencilIcon />,
    name: "Utilities",
    path: "/utilities",
    roles: ["Manager", "Admin"],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) =>
      prevOpenSubmenu && prevOpenSubmenu.type === menuType && prevOpenSubmenu.index === index
        ? null
        : { type: menuType, index }
    );
  };

  const filteredNavItems = navItems.filter((item) => user?.role && item.roles.includes(user.role));

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems
                  .filter((subItem) => {
                    // Filter by both role and employment type
                    if (subItem.roles && !subItem.roles.includes(user?.role || "")) {
                      return false;
                    }
                    if (subItem.allowedEmploymentTypes && !subItem.allowedEmploymentTypes.includes(user?.employmentType || "")) {
                      return false;
                    }
                    return true;
                  })
                  .map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path || "#"}  // Default to '#' if path is undefined
                        className={`menu-dropdown-item ${
                          isActive(subItem.path || "")  // Use fallback if path is undefined
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path || "")
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path || "")
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
  
  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center justify-center" : "justify-start"}`}>
        <Link to="/" className="flex items-center justify-center w-full">
          {(isExpanded || isHovered || isMobileOpen) && (
            <>
              <img className="dark:hidden" src="/images/logo/logo.png" alt="Logo" width={80} height={20} />
              <img className="hidden dark:block" src="/images/logo/logo-dark.png" alt="Logo" width={80} height={20} />
            </>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(filteredNavItems, "main")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;

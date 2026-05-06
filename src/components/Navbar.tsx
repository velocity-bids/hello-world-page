import { useState } from "react";
import { Car, Menu, User, LogOut, Shield, Bell, Gavel, Eye, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthModal } from "@/contexts/AuthModalContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { openLoginModal } = useAuthModal();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeLocale = i18n.language.startsWith("pt") ? pt : enGB;

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleMobileSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        <Link to="/" className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <span className="text-xl font-bold">BidWheels</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex absolute left-1/2 -translate-x-1/2">
          <Link to="/auctions" className="text-sm font-medium transition-colors hover:text-primary">
            {t("translation:nav.auctions")}
          </Link>
          <Link to="/sell" className="text-sm font-medium transition-colors hover:text-primary">
            {t("translation:nav.sell")}
          </Link>
          <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
            {t("translation:nav.about")}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex" title={t("translation:nav.notifications")}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="flex items-center justify-between border-b p-4">
                    <h3 className="font-semibold">{t("translation:nav.notifications")}</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                        {t("translation:notifications.markAllRead")}
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="mx-auto mb-2 h-12 w-12 opacity-50" />
                        <p>{t("translation:notifications.none")}</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`cursor-pointer p-4 transition-colors hover:bg-muted/50 ${
                              !notification.is_read ? "bg-primary/5" : ""
                            }`}
                            onClick={() => {
                              markAsRead(notification.id);
                              if (notification.type === "new_listing_submitted") {
                                navigate(`/review/${notification.vehicle_id}`);
                              } else {
                                navigate(`/vehicle/${notification.vehicle_id}`);
                              }
                            }}
                          >
                            <p className="text-sm">{notification.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: timeLocale,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex" title={t("translation:nav.account")}>
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("translation:nav.account")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/user/${user.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      {t("translation:nav.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("translation:nav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings">
                      <Car className="mr-2 h-4 w-4" />
                      {t("translation:nav.myListings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bids">
                      <Gavel className="mr-2 h-4 w-4" />
                      {t("translation:nav.myBids")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/watching">
                      <Eye className="mr-2 h-4 w-4" />
                      {t("translation:nav.watching")}
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          {t("translation:nav.adminDashboard")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("translation:nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/sell">
                <Button className="hidden sm:inline-flex">{t("translation:nav.listVehicle")}</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={openLoginModal} className="hidden sm:inline-flex">
                {t("translation:nav.signIn")}
              </Button>
              <Button className="hidden sm:inline-flex" onClick={openLoginModal}>
                {t("translation:nav.getStarted")}
              </Button>
            </>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" title={t("translation:common.menu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  BidWheels
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
                <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/auctions")}>
                  <Gavel className="mr-2 h-4 w-4" />
                  {t("translation:nav.auctions")}
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/sell")}>
                  <Car className="mr-2 h-4 w-4" />
                  {t("translation:nav.sellVehicle")}
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/about")}>
                  {t("translation:nav.about")}
                </Button>

                {user ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation(`/user/${user.id}`)}>
                      <User className="mr-2 h-4 w-4" />
                      {t("translation:nav.myProfile")}
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t("translation:nav.settings")}
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/my-listings")}>
                      <Car className="mr-2 h-4 w-4" />
                      {t("translation:nav.myListings")}
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/my-bids")}>
                      <Gavel className="mr-2 h-4 w-4" />
                      {t("translation:nav.myBids")}
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/watching")}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t("translation:nav.watching")}
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        {t("translation:nav.adminDashboard")}
                      </Button>
                    )}
                    <div className="my-2 h-px bg-border" />
                    <Button variant="ghost" className="justify-start text-destructive" onClick={handleMobileSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("translation:nav.signOut")}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Button
                      onClick={() => {
                        openLoginModal();
                        setMobileMenuOpen(false);
                      }}
                    >
                      {t("translation:nav.signIn")}
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

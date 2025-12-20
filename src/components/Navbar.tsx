import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Car, Menu, Search, User, LogOut, Shield, Bell, X, Gavel, Eye, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { openLoginModal } = useAuthModal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <span className="text-xl font-bold">BidWheels</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/auctions"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Auctions
          </Link>
          <Link
            to="/sell"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Sell
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            About
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end">
                  <div className="flex items-center justify-between border-b p-4">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-8 text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                              !notification.is_read ? "bg-primary/5" : ""
                            }`}
                            onClick={() => {
                              markAsRead(notification.id);
                              navigate(`/vehicle/${notification.vehicle_id}`);
                            }}
                          >
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
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
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/user/${user.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings">
                      <Car className="mr-2 h-4 w-4" />
                      My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bids">
                      <Gavel className="mr-2 h-4 w-4" />
                      My Bids
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/watching">
                      <Eye className="mr-2 h-4 w-4" />
                      Watching
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/sell">
                <Button className="hidden sm:inline-flex">List Vehicle</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={openLoginModal} className="hidden sm:inline-flex">Sign In</Button>
              <Button className="hidden sm:inline-flex" onClick={openLoginModal}>Get Started</Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
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
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleMobileNavigation("/auctions")}
                >
                  <Gavel className="mr-2 h-4 w-4" />
                  Auctions
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleMobileNavigation("/sell")}
                >
                  <Car className="mr-2 h-4 w-4" />
                  Sell a Vehicle
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleMobileNavigation("/about")}
                >
                  About
                </Button>

                {user ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleMobileNavigation(`/user/${user.id}`)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleMobileNavigation("/settings")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleMobileNavigation("/my-listings")}
                    >
                      <Car className="mr-2 h-4 w-4" />
                      My Listings
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleMobileNavigation("/my-bids")}
                    >
                      <Gavel className="mr-2 h-4 w-4" />
                      My Bids
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleMobileNavigation("/watching")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Watching
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => handleMobileNavigation("/admin")}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    )}
                    <div className="my-2 h-px bg-border" />
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive"
                      onClick={handleMobileSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
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
                      Sign In
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

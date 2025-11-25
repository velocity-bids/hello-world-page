import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

interface BidFiltersProps {
  statusFilter: string;
  sortBy: string;
  onStatusFilterChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  totalBids: number;
}

export const BidFilters = ({
  statusFilter,
  sortBy,
  onStatusFilterChange,
  onSortByChange,
  totalBids,
}: BidFiltersProps) => {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {totalBids} {totalBids === 1 ? "bid" : "bids"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="leading">Leading</SelectItem>
                <SelectItem value="outbid">Outbid</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="highest-bid">Highest Bid</SelectItem>
                <SelectItem value="lowest-bid">Lowest Bid</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || sortBy !== "recent") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onStatusFilterChange("all");
                  onSortByChange("recent");
                }}
                className="text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

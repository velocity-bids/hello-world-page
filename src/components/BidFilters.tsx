import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("translation:bidding.bid", { count: totalBids.toString() })}</span>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("translation:bidding.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("translation:bidding.allStatuses")}</SelectItem>
                <SelectItem value="leading">{t("translation:bidding.leading")}</SelectItem>
                <SelectItem value="outbid">{t("translation:bidding.outbid")}</SelectItem>
                <SelectItem value="won">{t("translation:bidding.won")}</SelectItem>
                <SelectItem value="lost">{t("translation:bidding.lost")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("translation:bidding.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t("translation:bidding.mostRecent")}</SelectItem>
                <SelectItem value="ending-soon">{t("translation:bidding.endingSoon")}</SelectItem>
                <SelectItem value="highest-bid">{t("translation:bidding.highestBid")}</SelectItem>
                <SelectItem value="lowest-bid">{t("translation:bidding.lowestBid")}</SelectItem>
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
                {t("translation:bidding.clear")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

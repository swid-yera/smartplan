"use client";

import { type FC, useCallback, useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@components";
import { getStatusLabels } from "@helpers";
import { cn } from "@lib";
import { services } from "@services";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shadcn";
import { useLocaleStore } from "@store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { StatusEnum } from "@types";
import {
  ArrowDownUp,
  Check,
  ChevronsUpDown,
  ListFilter,
  RotateCcw,
  UsersRound,
} from "lucide-react";

import localeDictionary from "./locale.json";
import {
  DEFAULT_RUP_SORT,
  buildRupFilterSearchParams,
  clearPersistedRupFilterState,
  getRupFilterStateFromSearchParams,
  persistRupFilterState,
} from "./rups-filter-state";

interface IProps {
  className?: string;
  compact?: boolean;
  paramPrefix?: string;
  persistKey?: string;
}

const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const ALL_STUDY_YEAR_VALUE = "__all-study-years__";

export const RupsFilterCard: FC<IProps> = ({
  className,
  compact = true,
  paramPrefix,
  persistKey,
}) => {
  const locale = useLocaleStore((state) => state.locale);
  const t = localeDictionary[locale] ?? localeDictionary.ru;
  const labels = getStatusLabels(locale);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsString = searchParams.toString();
  const storageKey = persistKey || undefined;
  const { data: groupsData = [], isLoading: isGroupsLoading } = useQuery({
    ...services.group.getAllOptions(),
    placeholderData: keepPreviousData,
  });
  const { data: studyYearsData = [], isLoading: isStudyYearsLoading } =
    useQuery({
      ...services.rup.getStudyYearsOptions(),
      placeholderData: keepPreviousData,
    });

  const initialState = getRupFilterStateFromSearchParams(
    new URLSearchParams(searchParamsString),
    { paramPrefix },
  );
  const [searchValue, setSearchValue] = useState(initialState.search);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    initialState.statuses,
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    initialState.groupIds,
  );
  const [selectedStudyYear, setSelectedStudyYear] = useState(
    initialState.studyYear,
  );
  const [selectedSort, setSelectedSort] = useState<"asc" | "desc">(
    initialState.sort,
  );
  const didMountRef = useRef(false);
  const sortedGroups = [...groupsData].sort((left, right) =>
    left.name.localeCompare(right.name, locale),
  );
  const sortedStudyYears = [...studyYearsData].sort((left, right) =>
    right.localeCompare(left, locale),
  );

  const selectedStatusesText = t.rupsFilter.statusesSelected.replace(
    "{count}",
    String(selectedStatuses.length),
  );
  const selectedGroupsText = t.rupsFilter.groupsSelected.replace(
    "{count}",
    String(selectedGroupIds.length),
  );
  const selectedStudyYearText = selectedStudyYear || t.rupsFilter.allYears;
  const selectedSortLabel =
    selectedSort === "asc" ? t.rupsFilter.sortAsc : t.rupsFilter.sortDesc;
  const hasSelectedStatuses = selectedStatuses.length > 0;
  const hasSelectedGroups = selectedGroupIds.length > 0;
  const hasSelectedStudyYear = selectedStudyYear.trim().length > 0;
  const hasActiveFilters = Boolean(
    searchValue.trim() ||
    selectedStatuses.length > 0 ||
    selectedGroupIds.length > 0 ||
    selectedStudyYear.trim() ||
    selectedSort !== DEFAULT_RUP_SORT,
  );

  useEffect(() => {
    const nextState = getRupFilterStateFromSearchParams(
      new URLSearchParams(searchParamsString),
      { paramPrefix },
    );

    setSearchValue((prev) =>
      prev === nextState.search ? prev : nextState.search,
    );
    setSelectedStatuses((prev) => {
      if (areStringArraysEqual(prev, nextState.statuses)) {
        return prev;
      }

      return nextState.statuses;
    });
    setSelectedGroupIds((prev) => {
      if (areStringArraysEqual(prev, nextState.groupIds)) {
        return prev;
      }

      return nextState.groupIds;
    });
    setSelectedStudyYear((prev) =>
      prev === nextState.studyYear ? prev : nextState.studyYear,
    );
    setSelectedSort((prev) =>
      prev === nextState.sort ? prev : nextState.sort,
    );
  }, [paramPrefix, searchParamsString]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status],
    );
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((item) => item !== groupId)
        : [...prev, groupId],
    );
  };

  const applyFilters = useCallback(() => {
    const currentQuery = searchParams.toString();
    const params = buildRupFilterSearchParams(
      new URLSearchParams(currentQuery),
      {
        search: searchValue,
        statuses: selectedStatuses,
        groupIds: selectedGroupIds,
        studyYear: selectedStudyYear,
        sort: selectedSort,
      },
      { resetPage: true, paramPrefix },
    );
    const nextQuery = params.toString();

    persistRupFilterState(
      {
        search: searchValue,
        statuses: selectedStatuses,
        groupIds: selectedGroupIds,
        studyYear: selectedStudyYear,
        sort: selectedSort,
      },
      storageKey,
    );

    if (nextQuery === currentQuery) return;

    router.replace(`${pathname}?${nextQuery}`, { scroll: false });
  }, [
    paramPrefix,
    pathname,
    router,
    searchParams,
    searchValue,
    selectedGroupIds,
    selectedStudyYear,
    selectedSort,
    selectedStatuses,
    storageKey,
  ]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;

      return;
    }

    applyFilters();
  }, [applyFilters, searchValue, selectedStatuses, selectedSort]);

  const resetFilters = useCallback(() => {
    const defaults = {
      search: "",
      statuses: [] as string[],
      groupIds: [] as string[],
      studyYear: "",
      sort: DEFAULT_RUP_SORT,
    };
    const params = buildRupFilterSearchParams(
      new URLSearchParams(searchParams.toString()),
      defaults,
      {
        resetPage: true,
        paramPrefix,
      },
    );

    clearPersistedRupFilterState(storageKey);
    setSearchValue(defaults.search);
    setSelectedStatuses(defaults.statuses);
    setSelectedGroupIds(defaults.groupIds);
    setSelectedStudyYear(defaults.studyYear);
    setSelectedSort(defaults.sort);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [paramPrefix, pathname, router, searchParams, storageKey]);

  if (compact) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="space-y-1">
                <Label className="sr-only">{t.rupsFilter.search}</Label>
                <Input
                  className="h-8 w-full min-w-52 text-xs sm:w-72"
                  name="q"
                  placeholder={t.rupsFilter.searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="sr-only">{t.rupsFilter.status}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label={t.rupsFilter.status}
                      className="h-8 min-w-36 justify-start gap-2 px-3 text-xs font-normal"
                      role="combobox"
                      title={
                        hasSelectedStatuses
                          ? selectedStatusesText
                          : t.rupsFilter.status
                      }
                      type="button"
                      variant="outline"
                    >
                      <ListFilter
                        className={cn(
                          "h-4 w-4 shrink-0",
                          hasSelectedStatuses && "text-primary",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate",
                          hasSelectedStatuses
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        {hasSelectedStatuses
                          ? selectedStatusesText
                          : t.rupsFilter.status}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) min-w-80 p-2"
                  >
                    <div className="space-y-2">
                      {Object.entries(labels).map(([status]) => (
                        <div key={status} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedStatuses.includes(status)}
                            id={status}
                            onCheckedChange={() => toggleStatus(status)}
                          />
                          <label
                            className="cursor-pointer select-none"
                            htmlFor={status}
                          >
                            <StatusBadge status={status as StatusEnum} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="sr-only">{t.rupsFilter.groups}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label={t.rupsFilter.groups}
                      className="h-8 min-w-36 justify-start gap-2 px-3 text-xs font-normal"
                      role="combobox"
                      title={
                        hasSelectedGroups
                          ? selectedGroupsText
                          : t.rupsFilter.selectGroups
                      }
                      type="button"
                      variant="outline"
                    >
                      <UsersRound
                        className={cn(
                          "h-4 w-4 shrink-0",
                          hasSelectedGroups && "text-primary",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate",
                          hasSelectedGroups
                            ? "text-primary"
                            : "text-foreground",
                        )}
                      >
                        {isGroupsLoading
                          ? t.rupsFilter.groupsLoading
                          : hasSelectedGroups
                            ? selectedGroupsText
                            : t.rupsFilter.selectGroups}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) min-w-80 p-2"
                  >
                    <div className="max-h-72 space-y-1 overflow-auto pr-1">
                      {sortedGroups.length > 0 ? (
                        sortedGroups.map((group) => {
                          const isSelected = selectedGroupIds.includes(
                            group.keycloakId,
                          );

                          return (
                            <button
                              key={group.keycloakId}
                              className={cn(
                                "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                                isSelected && "bg-primary/5 text-primary",
                              )}
                              type="button"
                              onClick={() => toggleGroup(group.keycloakId)}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {group.name}
                              </span>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4 shrink-0 transition-opacity",
                                  isSelected
                                    ? "opacity-100 text-primary"
                                    : "opacity-0",
                                )}
                              />
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          {isGroupsLoading
                            ? t.rupsFilter.groupsLoading
                            : t.rupsFilter.groupsEmpty}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="sr-only">{t.rupsFilter.studyYear}</Label>
                <Select
                  value={
                    hasSelectedStudyYear
                      ? selectedStudyYear
                      : ALL_STUDY_YEAR_VALUE
                  }
                  onValueChange={(value) =>
                    setSelectedStudyYear(
                      value === ALL_STUDY_YEAR_VALUE ? "" : value,
                    )
                  }
                >
                  <SelectTrigger
                    className="h-8 min-w-40 justify-start gap-2 px-3 text-xs font-normal"
                    title={selectedStudyYearText}
                  >
                    <span
                      className={cn(
                        "truncate",
                        hasSelectedStudyYear
                          ? "text-primary"
                          : "text-foreground",
                      )}
                    >
                      {isStudyYearsLoading
                        ? t.rupsFilter.studyYearsLoading
                        : hasSelectedStudyYear
                          ? selectedStudyYearText
                          : t.rupsFilter.allYears}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STUDY_YEAR_VALUE}>
                      {t.rupsFilter.allYears}
                    </SelectItem>
                    {sortedStudyYears.map((studyYear) => (
                      <SelectItem key={studyYear} value={studyYear}>
                        {studyYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="sr-only">{t.rupsFilter.sort}</Label>
                <Select
                  value={selectedSort}
                  onValueChange={(value: "asc" | "desc") =>
                    setSelectedSort(value)
                  }
                >
                  <SelectTrigger
                    className="h-8 justify-start gap-1.5 px-2 text-xs font-normal"
                    size="sm"
                    title={selectedSortLabel}
                  >
                    <ArrowDownUp className="h-4 w-4 shrink-0" />
                    <SelectValue
                      className="truncate text-left"
                      placeholder={t.rupsFilter.sort}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">
                      {t.rupsFilter.sortDesc}
                    </SelectItem>
                    <SelectItem value="asc">{t.rupsFilter.sortAsc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
                <Button
                  className="h-8 gap-2 px-3 text-xs font-normal"
                  disabled={!hasActiveFilters}
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.rupsFilter.reset}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="gap-1">
        <CardTitle>{t.rupsFilter.title}</CardTitle>
        <CardDescription>{t.rupsFilter.description}</CardDescription>
      </CardHeader>

      <CardContent className="h-full">
        <div className="flex h-full flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="grid w-full gap-3 md:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  {t.rupsFilter.search}
                </Label>
                <Input
                  name="q"
                  placeholder={t.rupsFilter.searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  {t.rupsFilter.status}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label={t.rupsFilter.status}
                      className="w-full justify-between font-normal"
                      role="combobox"
                      title={
                        hasSelectedStatuses
                          ? selectedStatusesText
                          : t.rupsFilter.status
                      }
                      type="button"
                      variant="outline"
                    >
                      {hasSelectedStatuses ? (
                        <span className="truncate text-primary">
                          {selectedStatusesText}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t.rupsFilter.selectStatuses}
                        </span>
                      )}
                      <ChevronsUpDown
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0 opacity-50",
                          hasSelectedStatuses && "text-primary",
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) p-2"
                  >
                    <div className="space-y-2">
                      {Object.entries(labels).map(([status]) => (
                        <div key={status} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedStatuses.includes(status)}
                            id={status}
                            onCheckedChange={() => toggleStatus(status)}
                          />
                          <label
                            className="cursor-pointer select-none"
                            htmlFor={status}
                          >
                            <StatusBadge status={status as StatusEnum} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  {t.rupsFilter.groups}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label={t.rupsFilter.groups}
                      className="w-full justify-between font-normal"
                      role="combobox"
                      title={
                        hasSelectedGroups
                          ? selectedGroupsText
                          : t.rupsFilter.selectGroups
                      }
                      type="button"
                      variant="outline"
                    >
                      <span
                        className={cn(
                          "truncate",
                          hasSelectedGroups
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {isGroupsLoading
                          ? t.rupsFilter.groupsLoading
                          : hasSelectedGroups
                            ? selectedGroupsText
                            : t.rupsFilter.selectGroups}
                      </span>
                      <UsersRound
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0 opacity-50",
                          hasSelectedGroups && "text-primary",
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-(--radix-popover-trigger-width) min-w-80 p-2"
                  >
                    <div className="max-h-72 space-y-1 overflow-auto pr-1">
                      {sortedGroups.length > 0 ? (
                        sortedGroups.map((group) => {
                          const isSelected = selectedGroupIds.includes(
                            group.keycloakId,
                          );

                          return (
                            <button
                              key={group.keycloakId}
                              className={cn(
                                "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                                isSelected && "bg-primary/5 text-primary",
                              )}
                              type="button"
                              onClick={() => toggleGroup(group.keycloakId)}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {group.name}
                              </span>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4 shrink-0 transition-opacity",
                                  isSelected
                                    ? "opacity-100 text-primary"
                                    : "opacity-0",
                                )}
                              />
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground">
                          {isGroupsLoading
                            ? t.rupsFilter.groupsLoading
                            : t.rupsFilter.groupsEmpty}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  {t.rupsFilter.studyYear}
                </Label>
                <Select
                  value={
                    hasSelectedStudyYear
                      ? selectedStudyYear
                      : ALL_STUDY_YEAR_VALUE
                  }
                  onValueChange={(value) =>
                    setSelectedStudyYear(
                      value === ALL_STUDY_YEAR_VALUE ? "" : value,
                    )
                  }
                >
                  <SelectTrigger
                    className="h-9 w-full justify-between font-normal"
                    title={selectedStudyYearText}
                  >
                    <span
                      className={cn(
                        "truncate",
                        hasSelectedStudyYear
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {isStudyYearsLoading
                        ? t.rupsFilter.studyYearsLoading
                        : hasSelectedStudyYear
                          ? selectedStudyYearText
                          : t.rupsFilter.allYears}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STUDY_YEAR_VALUE}>
                      {t.rupsFilter.allYears}
                    </SelectItem>
                    {sortedStudyYears.map((studyYear) => (
                      <SelectItem key={studyYear} value={studyYear}>
                        {studyYear}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  {t.rupsFilter.sort}
                </Label>
                <Select
                  value={selectedSort}
                  onValueChange={(value: "asc" | "desc") =>
                    setSelectedSort(value)
                  }
                >
                  <SelectTrigger
                    className="h-9 w-full"
                    title={selectedSortLabel}
                  >
                    <SelectValue placeholder={t.rupsFilter.sort} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">
                      {t.rupsFilter.sortDesc}
                    </SelectItem>
                    <SelectItem value="asc">{t.rupsFilter.sortAsc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end lg:w-auto">
              <Button
                className="h-9 w-full px-5 sm:w-auto"
                disabled={!hasActiveFilters}
                type="button"
                variant="outline"
                onClick={resetFilters}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t.rupsFilter.reset}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.rupsFilter.selectedStatusesTitle}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStatuses.length > 0 ? (
                    selectedStatuses.map((status) => (
                      <StatusBadge key={status} status={status as StatusEnum} />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t.rupsFilter.nothingSelected}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.rupsFilter.selectedGroupsTitle}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroupIds.length > 0 ? (
                    selectedGroupIds.map((groupId) => {
                      const group = groupsData.find(
                        (item) => item.keycloakId === groupId,
                      );
                      return (
                        <span
                          key={groupId}
                          className="inline-flex h-7 items-center rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground"
                        >
                          {group?.name || groupId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t.rupsFilter.nothingSelected}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.rupsFilter.studyYear}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hasSelectedStudyYear ? (
                    <span className="inline-flex h-7 items-center rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground">
                      {selectedStudyYear}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t.rupsFilter.allYears}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

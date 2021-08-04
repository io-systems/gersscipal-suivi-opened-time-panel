import React, { useEffect, useState, useRef } from 'react';
import { dateTime, GrafanaTheme2, PanelProps, TimeRange } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { IconButton, stylesFactory, useTheme2 } from '@grafana/ui';

import { GspTimeRange, ProductionOptions } from 'types';

interface Props extends PanelProps<ProductionOptions> {}
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const ProductionPanel: React.FC<Props> = ({
  data,
  options,
  timeRange,
  width,
  height,
  onChangeTimeRange,
}: Props) => {
  const firstInit = useRef<boolean>(false);
  const shiftSchedule = useRef<GspTimeRange[]>();
  const lastTimeRange = useRef<string>();
  const refreshInterval = useRef<NodeJS.Timeout>();
  const theme = useTheme2();
  const styles = getStyles(theme);
  let validSetup = useRef(false);
  let [week, setWeek] = useState<any[]>([]);
  let [selectedDateInRange, setSelectedDateInRange] = useState<string>(new Date().toDateString());

  const getMinutesFromGspPeriod = (period: string): number => {
    const tmp = period.split(':');
    return Number(tmp[0]) * 60 + Number(tmp[1]);
  };

  const parseSetupPeriods = (day: Date): TimeRange => {
    let parsedPeriodFrom = [0, 0]; // [ heures, minutes ]
    let parsedPeriodTo = [0, 0]; // [ heures, minutes ]

    // pas de période de production définie, abandon
    if (!Array.isArray(shiftSchedule.current) || shiftSchedule.current.length < 0) {
      return timeRange;
    }

    switch (shiftSchedule.current.length) {
      case 0:
        return timeRange;

      case 1:
        // on ne traite qu'avec un seul index
        parsedPeriodFrom = shiftSchedule.current[0].start.split(':').map((t: string) => Number(t));
        parsedPeriodTo = shiftSchedule.current[0].end.split(':').map((t: string) => Number(t));
        break;

      default:
        // on réalise une copie du tableau
        const tmp: GspTimeRange[] = [];
        for (let p of shiftSchedule.current) {
          tmp.push({ ...p });
        }
        // on trie du start le plus petit a start le plus grand et on ne conserve que le premier élément
        tmp.sort((a, b) => getMinutesFromGspPeriod(a.start) - getMinutesFromGspPeriod(b.start));
        parsedPeriodFrom = tmp[0].start.split(':').map((t: string) => Number(t));

        // on trie du end le plus grand a end le plus petit et on ne conserve que le premier élément
        tmp.sort((a, b) => getMinutesFromGspPeriod(b.end) - getMinutesFromGspPeriod(a.end));
        parsedPeriodTo = tmp[0].end.split(':').map((t: string) => Number(t));
        break;
    }
    const from = new Date(day);
    const to = new Date(day);
    const now = new Date();
    const dayIsToday = from.toDateString() === now.toDateString();
    from.setHours(parsedPeriodFrom[0], parsedPeriodFrom[1], 0, 0);
    to.setHours(parsedPeriodTo[0], parsedPeriodTo[1], 0, 0);
    if (dayIsToday && now.getTime() < to.getTime() && now.getTime() > from.getTime()) {
      to.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    }
    return { from: dateTime(from), to: dateTime(to), raw: { from: from.toLocaleString(), to: to.toLocaleString() } };
  };

  const setTimePeriod = (day: Date) => {
    const { from, to } = parseSetupPeriods(day);
    const newTimeRange = { from: from.valueOf(), to: to.valueOf() };
    setSelectedDateInRange(timeRange.from.toDate().toDateString());
    if (JSON.stringify(newTimeRange) !== lastTimeRange.current) {
      onChangeTimeRange(newTimeRange);
      lastTimeRange.current = JSON.stringify(newTimeRange);
    }
  };
  const updateTodayTimePeriod = () => {
    if (!week || week.length <= 0) {
      return;
    }
    let e = new Date();
    const weekDayIndex = week.findIndex((day) => day.setup.weekDay === e.getDay());
    if (weekDayIndex < 0) {
      return;
    }
    setTimePeriod(e);
  };

  const refreshWeek = (day: Date) => {
    // le paramètre day est toujours le dernier jour de la semaine
    if (!shiftSchedule.current) {
      return;
    }
    let tmp: any[] = [];
    for (let i = 6; i >= 0; i--) {
      let d = new Date(day);
      d.setDate(day.getDate() - i);
      tmp.push({
        day: d,
        setup: {
          day: WEEKDAYS[d.getDay()],
          weekDay: d.getDay(),
          periods: shiftSchedule.current,
        },
      });
    }
    setWeek(tmp);
    if (!firstInit.current) {
      let e = new Date();
      const i = tmp.findIndex((day) => day.setup.weekDay === e.getDay());
      if (i > -1) {
        setTimePeriod(tmp[i].day);
      }
      firstInit.current = true;
    }
  };

  const getShiftSchedule = () => {
    if (data.state !== 'Done' || data.series.length <= 0) {
      return;
    }
    const shiftSched = data.series.find((serie) => serie.refId === 'shiftSchedule');
    if (!shiftSched) {
      return;
    }
    if (!shiftSched.fields || shiftSched.fields.length < 0) {
      return;
    }
    let tmpStart = shiftSched.fields.filter((field) => field.name === 'start');
    if (tmpStart.length !== 1) {
      return;
    }
    let tmpEnd = shiftSched.fields.filter((field) => field.name === 'end');
    if (tmpEnd.length !== 1) {
      return;
    }
    const tmpSched = {
      start: tmpStart[0].values.toArray(),
      end: tmpEnd[0].values.toArray(),
    };
    shiftSchedule.current = tmpSched.start.map((startval, i) => ({
      start: tmpSched.start[i],
      end: tmpSched.end[i],
    }));
    if (!week || week.length <= 0) {
      // get next sunday date (sunday.getDay() = 0)
      const nextSunday = new Date();
      if (nextSunday.getDay() !== 0) {
        nextSunday.setDate(nextSunday.getDate() + 7 - nextSunday.getDay());
      }
      refreshWeek(nextSunday);
    }
    validSetup.current = true;
  };

  useEffect(() => {
    getShiftSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    if (timeRange.from.toDate().toDateString() === new Date().toDateString()) {
      updateTodayTimePeriod();
      if (options.autoRefresh) {
        refreshInterval.current = setInterval(() => {
          updateTodayTimePeriod();
        }, options.refreshSeconds * 1000);
      }
    } else {
      setTimePeriod(timeRange.from.toDate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, options.autoRefresh, options.refreshSeconds]);

  const render = () => {
    return (
      <div
        className={cx(
          styles.wrapper,
          css`
            width: ${width}px;
            height: ${height}px;
          `
        )}
      >
        <IconButton
          name="arrow-left"
          size="xxl"
          disabled={week.length <= 0}
          onClick={() => {
            const lastWeekDay = week[week.length - 1].day;
            lastWeekDay.setDate(lastWeekDay.getDate() - 7);
            refreshWeek(lastWeekDay);
          }}
        />
        {validSetup &&
          week.map((day) => (
            <div
              key={day.day.toString()}
              className={cx(styles.cardContent, {
                [css`
                  border-bottom: 1px solid ${theme.colors.warning.border};
                `]: day.day.toDateString() === new Date().toDateString(),
                [css`
                  display: none;
                `]: day.setup.periods.length <= 0,
                [css`
                  border: 1px solid ${theme.colors.primary.border};
                `]: day.day.toDateString() === selectedDateInRange,
              })}
              onClick={() => {
                setTimePeriod(day.day);
              }}
            >
              <h3>{day.setup.day}</h3>
              <p>{day.day.toLocaleDateString()}</p>
            </div>
          ))}
        <IconButton
          name="arrow-right"
          size="xxl"
          disabled={week.length <= 0 || (week.length > 0 && week[week.length - 1].day >= new Date())}
          onClick={() => {
            const lastWeekDay = week[week.length - 1].day;
            lastWeekDay.setDate(lastWeekDay.getDate() + 7);
            refreshWeek(lastWeekDay);
          }}
        />
      </div>
    );
  };

  return render();
};

const getStyles = stylesFactory((theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      position: relative;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: stretch;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
    cardContent: css`
      flex: 1 1 auto;
      display: flex;
      flex-flow: column nowrap;
      justify-content: start;
      align-items: center;
    `,
    today: css``,
  };
});

// For Grafana versions older than 7.3.0.
export const legacyClassicColors = [
  '#7EB26D', // 0: pale green
  '#EAB839', // 1: mustard
  '#6ED0E0', // 2: light blue
  '#EF843C', // 3: orange
  '#E24D42', // 4: red
  '#1F78C1', // 5: ocean
  '#BA43A9', // 6: purple
  '#705DA0', // 7: violet
  '#508642', // 8: dark green
  '#CCA300', // 9: dark sand
  '#447EBC',
  '#C15C17',
  '#890F02',
  '#0A437C',
  '#6D1F62',
  '#584477',
  '#B7DBAB',
  '#F4D598',
  '#70DBED',
  '#F9BA8F',
  '#F29191',
  '#82B5D8',
  '#E5A8E2',
  '#AEA2E0',
  '#629E51',
  '#E5AC0E',
  '#64B0C8',
  '#E0752D',
  '#BF1B00',
  '#0A50A1',
  '#962D82',
  '#614D93',
  '#9AC48A',
  '#F2C96D',
  '#65C5DB',
  '#F9934E',
  '#EA6460',
  '#5195CE',
  '#D683CE',
  '#806EB7',
  '#3F6833',
  '#967302',
  '#2F575E',
  '#99440A',
  '#58140C',
  '#052B51',
  '#511749',
  '#3F2B5B',
  '#E0F9D7',
  '#FCEACA',
  '#CFFAFF',
  '#F9E2D2',
  '#FCE2DE',
  '#BADFF4',
  '#F9D9F9',
  '#DEDAF7',
];

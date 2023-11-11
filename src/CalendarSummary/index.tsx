import React, { useEffect, useState } from 'react';
import getCalendarEvents from '../api-client';

interface DailySummary {
	date: Date;
	eventCount: number;
	totalDuration: number;
	longestEventTitle: string;
}

const CalendarSummary: React.FunctionComponent = () => {
	const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
	const [isLoading, setLoading] = useState(false);
	const [isError, setError] = useState(false);

	const fetchDailySummaries = async () => {
		try {
			setLoading(true);

			// Create array of next 7 dates
			const currentDate = new Date();
			const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
				const nextDate = new Date(currentDate);
				nextDate.setDate(currentDate.getDate() + i);
				return nextDate;
			});

			const result = await Promise.all(
				nextWeekDates.map(async (date) => {
					const events = await getCalendarEvents(date);
					const totalDuration = events.reduce((totalDuration, { durationInMinutes }) => totalDuration + durationInMinutes, 0);
					const longestEventTitle = events.reduce((longestEvent, event) => (event.durationInMinutes > longestEvent.durationInMinutes ? event : longestEvent)).title;

					return {
						date,
						eventCount: events.length,
						totalDuration,
						longestEventTitle,
					};
				})
			);

			setDailySummaries(result);
		} catch (error) {
			setError(true);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDailySummaries();
	}, []);

	if (isLoading) return <p>Loading...</p>;
	if (isError) return <p>Error fetching data. Please try again later.</p>;
	if (!dailySummaries.length) return <p>Summary list is empty</p>;

	const weekSummaryEventCount = dailySummaries.reduce((total, { eventCount }) => total + eventCount, 0);
	const weekSummaryTotalDuration = dailySummaries.reduce((total, { totalDuration }) => total + totalDuration, 0);
	const weekSummaryLongestEventTitle = dailySummaries.reduce((longestEvent, dailySummary) => (dailySummary.totalDuration > longestEvent.totalDuration ? dailySummary : longestEvent)).longestEventTitle;

	return (
		<div>
			<h2>Calendar summary</h2>
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Number of events</th>
						<th>Total duration [min]</th>
						<th>Longest event</th>
					</tr>
				</thead>
				<tbody>
					{dailySummaries.map(({ date, eventCount, totalDuration, longestEventTitle }, i) => (
						<tr key={date.toISOString()} style={{ backgroundColor: i % 2 === 0 ? '#f2f2f2' : '#fff' }}>
							<td>{date.toISOString().split('T')[0]}</td>
							<td>{eventCount}</td>
							<td>{totalDuration}</td>
							<td>{longestEventTitle}</td>
						</tr>
					))}
					<tr>
						<td>Total</td>
						<td>{weekSummaryEventCount}</td>
						<td>{weekSummaryTotalDuration}</td>
						<td>{weekSummaryLongestEventTitle}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

export default CalendarSummary;

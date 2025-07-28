import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import dayjs from "dayjs";

const CustomLegend = ({ payload }) => (
  <ul
    style={{
      listStyle: "none",
      margin: 0,
      padding: "0.5rem",
      textAlign: "right",
      lineHeight: "1.2",
    }}
  >
    {payload.map((entry, index) => (
      <li
        key={`item-${index}`}
        style={{
          color: entry.color,
          fontSize: "0.85rem",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "top",
          gap: "0.5rem",
        }}
      >
        <span>{entry.value}</span>
        <span
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            backgroundColor: entry.color,
            borderRadius: "50%",
          }}
        />
      </li>
    ))}
  </ul>
);

function TrendChart({ refreshKey, setLastScraped }) {
  const [data, setData] = useState([]);
  const [topTitles, setTopTitles] = useState([]);

  const COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f"];

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/analysis")
      .then((res) => {
        if (!Array.isArray(res.data)) {
          console.error("API did not return an array:", res.data);
          return;
        }

        const titles = [...new Set(res.data.map((d) => d.Title))];
        setTopTitles(titles);

        const timePoints = [
          ...new Set(res.data.map((d) => d.ScrapeTime)),
        ].sort();

        if (timePoints.length > 0 && setLastScraped) {
          const latest = timePoints.at(-1);
          const readable = dayjs(latest, "YYYYMMDD_HHmmss").format(
            "D MMM YYYY, HH:mm"
          );
          setLastScraped(readable);
        }

        const chartData = timePoints.map((time) => {
          const row = { ScrapeTime: time };
          res.data.forEach((d) => {
            if (d.ScrapeTime === time) {
              row[`${d.Title}_IMDbScore`] = d.IMDbScore
                ? parseFloat(d.IMDbScore)
                : null;
              row[`${d.Title}_VoteCount`] = d.VoteCount
                ? parseInt(d.VoteCount)
                : null;
            }
          });
          return row;
        });

        setData(chartData);
      })
      .catch((err) => console.error("Error loading trend data:", err));
  }, [refreshKey]);

  const formatDate = (timestamp) => dayjs(timestamp).format("D MMM, HH:mm");
  const formatScore = (value) => (value != null ? value.toFixed(1) : "N/A");
  const formatVotes = (value) =>
    value != null ? `${value.toLocaleString()} votes` : "N/A";

  const customLegendStyle = {
    layout: "vertical",
    align: "right",
    verticalAlign: "middle",
    wrapperStyle: {
      paddingLeft: "30px", // space between chart and legend
      fontSize: "0.85rem",
    },
  };

  const axisStyle = {
    tickMargin: 12, // space between tick labels and axis
  };

  return (
    <div className='chart-wrapper'>
      <h2>⭐ Top 5 Movies Rating Score Over Time</h2>
      {data.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 80, color: "#666" }}>
          No data available
        </p>
      ) : (
        <ResponsiveContainer width='100%' height={350}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 100, left: 20, bottom: 40 }}
          >
            <XAxis
              dataKey='ScrapeTime'
              tickFormatter={formatDate}
              {...axisStyle}
            />
            <YAxis domain={[0, 10]} {...axisStyle} />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value, name) => [formatScore(value), name]}
              contentStyle={{
                borderRadius: "10px",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                padding: "10px",
              }}
            />
            <Legend
              verticalAlign='middle'
              align='right'
              layout='vertical'
              iconType='plainline'
              content={<CustomLegend />}
            />
            {topTitles.map((title, idx) => (
              <Line
                key={title}
                type='monotone'
                dataKey={`${title}_IMDbScore`}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={title}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      <h2 style={{ marginTop: 40 }}>👥 Top 5 Movies Rating Count Over Time</h2>
      {data.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 80, color: "#666" }}>
          No data available
        </p>
      ) : (
        <ResponsiveContainer width='100%' height={350}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 100, left: 20, bottom: 40 }}
          >
            <XAxis
              dataKey='ScrapeTime'
              tickFormatter={formatDate}
              {...axisStyle}
            />
            <YAxis {...axisStyle} />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value, name) => [formatVotes(value), name]}
              contentStyle={{
                borderRadius: "10px",
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                padding: "10px",
              }}
            />
            <Legend
              verticalAlign='middle'
              align='right'
              layout='vertical'
              iconType='plainline'
              content={<CustomLegend />}
            />
            {topTitles.map((title, idx) => (
              <Line
                key={title}
                type='monotone'
                dataKey={`${title}_VoteCount`}
                stroke={COLORS[idx % COLORS.length]}
                strokeDasharray='4 4'
                strokeWidth={2}
                dot={false}
                name={title}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default TrendChart;

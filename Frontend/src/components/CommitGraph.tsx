import { useEffect, useState } from "react";
import { fetchCommits } from "../api/githubApi";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const CommitGraph = () => {
  const [commitData, setCommitData] = useState<{ date: Date; count: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCommits();
        setCommitData(data);
      } catch (error) {
        console.error("Error loading commits:", error);
      }
    };
    loadData();
  }, []);

  const chartData = {
    labels: commitData.map(commit => commit.date.toISOString().split("T")[0]), // Convert date to YYYY-MM-DD
    datasets: [
      {
        label: "Commits Over Time",
        data: commitData.map(commit => commit.count),
        borderColor: "rgb(85, 213, 113)",
        backgroundColor: "rgba(111, 152, 152, 0)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            ticks: {
              display: false,
            },
            grid: {
              drawTicks: false,
            },
          },
      y: {
        ticks: {
          stepSize: 1,
        },
        min: 0, 
        max: Math.max(...commitData.map(commit => commit.count)) + 2, 
      },
    },
  };

  return (
    <div style={{ marginTop: "20px", height: "300px", position: "relative", overflow: "hidden" }}>
      <h2>Commit Activity</h2>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default CommitGraph;

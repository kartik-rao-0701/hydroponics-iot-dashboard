import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import io from "socket.io-client";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  FlaskConical,
  Waves,
  Droplet,
  Power,
  Sun,
} from "lucide-react";

/**
 * Environment variables give you flexibility when deploying.
 * VITE_SOCKET_URL defaults to localhost for development.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const MAX_POINTS = 20;

/**
 * Reusable card for any single sensor reading.
 */
const SensorCard = ({ Icon, title, value, unit, optimal }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="rounded-2xl shadow-md hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="text-4xl font-semibold">
        {value}
        <span className="text-base font-normal ml-1 text-muted-foreground">{unit}</span>
      </CardContent>
      {optimal && (
        <p className="px-4 pb-4 text-xs text-muted-foreground">
          Optimal: {optimal}
        </p>
      )}
    </Card>
  </motion.div>
);

/**
 * Reusable switch with label and description.
 */
const ControlSwitch = ({
  label,
  description,
  checked,
  onChange,
  loading,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="rounded-2xl shadow-md hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">{label}</CardTitle>
        <Switch checked={checked} onCheckedChange={onChange} disabled={loading} />
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground pb-4">
        {description}
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 24.5,
    ph: 6.2,
    ec: 1.8,
    waterLevel: 85,
    timestamp: Date.now(),
  });
  const [chartData, setChartData] = useState([]);
  const [controls, setControls] = useState({
    pump: false,
    lights: true,
    dosing: false,
  });
  const [loadingControl, setLoadingControl] = useState(null);

  // Socket is memoised so the component mounts only one connection.
  const socket = React.useMemo(() => io(SOCKET_URL), []);

  /**
   * Side‑effect: listen for real‑time updates & clean up.
   */
  useEffect(() => {
    socket.on("sensorUpdate", (data) => {
      setSensorData(data);
      setChartData((prev) => [
        ...prev.slice(-(MAX_POINTS - 1)),
        {
          time: new Date(data.timestamp).toLocaleTimeString(),
          temperature: data.temperature,
          ph: data.ph,
          ec: data.ec,
        },
      ]);
    });

    socket.on("controlUpdate", (data) => {
      setControls((prev) => ({ ...prev, [data.action]: data.value }));
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  /**
   * POST control change to backend & optimistically update UI.
   */
  const handleControlChange = useCallback(
    async (control, value) => {
      setLoadingControl(control);
      try {
        // Optimistic UI update
        setControls((prev) => ({ ...prev, [control]: value }));

        await fetch(`${SOCKET_URL}/api/controls/${control}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });
      } catch (error) {
        console.error("Failed to update control:", error);
      } finally {
        setLoadingControl(null);
      }
    },
    []
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hydroponics Dashboard</h1>
      <p className="text-sm text-muted-foreground pb-4 flex items-center gap-2">
        <Power className="w-4 h-4 text-green-500" /> ESP32 Connected
      </p>

      {/* Sensor Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard
          Icon={Thermometer}
          title="Temperature"
          value={sensorData.temperature.toFixed(1)}
          unit="°C"
          optimal="22‑26°C"
        />
        <SensorCard
          Icon={FlaskConical}
          title="pH"
          value={sensorData.ph.toFixed(1)}
          unit=""
          optimal="5.8‑6.5"
        />
        <SensorCard
          Icon={Waves}
          title="EC"
          value={sensorData.ec.toFixed(1)}
          unit="mS/cm"
          optimal="1.2‑2.4"
        />
        <SensorCard
          Icon={Droplet}
          title="Water Level"
          value={sensorData.waterLevel}
          unit="%"
        />
      </section>

      {/* Charts */}
      <section className="h-80 bg-background rounded-2xl shadow-md">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Temperature & pH Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" domain={[0, "dataMax + 5"]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 14]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="ph" stroke="#82ca9d" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Controls */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ControlSwitch
          label="Water Pump"
          description="Circulation system"
          checked={controls.pump}
          loading={loadingControl === "pump"}
          onChange={(value) => handleControlChange("pump", value)}
        />

        <ControlSwitch
          label="Grow Lights"
          description="LED lighting system"
          checked={controls.lights}
          loading={loadingControl === "lights"}
          onChange={(value) => handleControlChange("lights", value)}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-2xl shadow-md hover:shadow-lg flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-lg">Nutrient Dosing</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2 text-muted-foreground">
              <p>Manual nutrient addition</p>
              <Button
                onClick={() => handleControlChange("dosing", true)}
                disabled={loadingControl === "dosing"}
              >
                Add Nutrients
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Dashboard;
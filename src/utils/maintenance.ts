import axios from "axios";
import { MAINTENANCE_STATUS_URL } from "../config";

type MaintenanceStatusComponent = "trade";
export const fetchMaintenanceStatus = async (
  component: MaintenanceStatusComponent,
): Promise<boolean> => {
  try {
    const result = await axios.get(MAINTENANCE_STATUS_URL);
    return !!result.data[component];
  } catch (e) {
    console.error("Error fetching maintenance status", e);
    return false;
  }
};

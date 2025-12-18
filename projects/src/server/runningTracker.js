import { getHabits } from "./habits";

export async function notifiToast() {
  try {
    const data = await getHabits(); // getHabits phải trả về dữ liệu
    //console.log.log("res",data);
    const ids = (data?.habits ?? []).map((e: any) => e._id);
    //console.log.log(ids);

    return ids;
  } catch (err) {
    //console.log.error("notifiToast error:", err);
    return [];
  }
}

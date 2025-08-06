import NewMatch from "@/modules/NewMatch/newMatch";
import { Container } from "@mui/material";

export default async function Index() {
  return (
    <div className="flex-1 w-full mt-10 flex flex-col items-center">
      <div className="px-2">
        <div className="flex-1 flex flex-col gap-6">
          <Container maxWidth="xl" sx={{ padding: "0" }}>
            <div
              style={{
                paddingTop: "10px",
                paddingBottom: "40px",
              }}
            >
              <NewMatch />
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}

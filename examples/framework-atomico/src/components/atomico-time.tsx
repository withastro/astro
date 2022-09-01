import { c, useProp, useEffect } from "atomico";

const getNow = () => new Date();

function atomicoTime() {
  const [date, setDate] = useProp<Date>("date");

  useEffect(() => {
    const id = setInterval(setDate, 1000, getNow);
    return () => clearInterval(id);
  }, []);

  return (
    <host>
      <h3>{date.toString()}</h3>
    </host>
  );
}

atomicoTime.props = {
  date: {
    type: Date,
    value: getNow,
  },
};

export const AtomicoTime = c(atomicoTime);

customElements.define("atomico-time", AtomicoTime);

export type Props = {
  text: string;
};

export const MultiLineText = ({ text }: Props) => (
  <>
    {text.split(/\n/).map((line, i) => (
      <div key={i}>
        <span style={{ whiteSpace: "pre-wrap" }}>{line}</span>
        <br />
      </div>
    ))}
  </>
);

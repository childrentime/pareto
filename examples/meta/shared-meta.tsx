import { Helmet } from "react-helmet-async";

const Meta = () => {
  return (
    <Helmet>
      <title>A fancy webpage</title>
      <link rel="notImportant" href="https://www.chipotle.com" />
      <meta name="whatever" content="notImportant" />
      <link rel="canonical" href="https://www.tacobell.com" />
      <meta property="og:title" content="A very important title" />
    </Helmet>
  );
};

export default Meta;

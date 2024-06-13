import { useEffect, useRef, useState } from "react";
import styles from "./style.module.scss";
import monitorLogo from './monitor.png';

const Logo = (props: { onClick: () => void }) => {
  const { onClick } = props;

  const divRef = useRef(null);
  const mountedRef = useRef(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const rect = divRef.current.getBoundingClientRect();

    mountedRef.current = true;
    setPos({ x: rect.left, y: rect.top });
  }, []);

  useEffect(() => {
    const div = divRef.current;
    const onMove = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = divRef.current.getBoundingClientRect();
      const bounding = {
        x: window.innerWidth - rect.width,
        y: window.innerHeight - rect.height,
      };

      const touch = event.touches[0];
      let x = touch.clientX - rect.width / 2;
      let y = touch.clientY - rect.height / 2;

      if (x < 0) {
        x = 0;
      } else if (x > bounding.x) {
        x = bounding.x;
      }

      if (y < 0) {
        y = 0;
      } else if (y > bounding.y) {
        y = bounding.y;
      }

      setPos({ x, y });
    };

    div && div.addEventListener("touchmove", onMove, { passive: false });

    return () => div && div.removeEventListener("touchmove", onMove);
  }, []);

  const style = mountedRef.current ? { left: pos.x, top: pos.y } : { top: 205 };

  return (
    <div
      ref={divRef}
      className={styles.draggableLogoMonitor}
      style={{...style, backgroundImage: `url(${monitorLogo})`}}
      onClick={onClick}
    />
  );
};

export default Logo;

import {  promiseMap } from "@paretojs/core";
import { use } from "react";
import { getRecommendsKey } from "../stream";
import { Image } from "../../../utils";

interface RecommendData {
  feeds: {
    name: string;
    avatar: string;
    time: string;
    action: string;
    repositoryName: string;
    repositoryAvatar: string;
    desc: string;
  }[];
}

export function Recommends() {
  const { feeds }: RecommendData = use(promiseMap.get(getRecommendsKey)!);

  return (
    <div className="mt-5">
      <div className="text-black">Recommends</div>
      <div className="mt-3">
        {feeds.map((item, index) => (
          <div className="flex flex-col justify-start items-center bg-slate-400 p-3 mt-4 first:mt-0" key={index}>
            <div className="w-full flex justify-start items-center">
              <div className="w-10 h-10 mr-3">
                <Image src={item.avatar} className="w-full h-full rounded-full"/>
              </div>
              <div>
                <div className="flex font-bold">
                  {item.name} <div className="font-normal ml-1 opacity-60">{item.action}</div>
                </div>
                <div className="opacity-60 mt-1 text-sm">{item.time}</div>
              </div>
            </div>
            <div className="w-full flex mt-2 pl-3">
              <div className="w-5 h-5">
                <Image src={item.repositoryAvatar} className="w-full h-full rounded-full"/>
              </div>
              <div className="font-bold ml-1">{item.repositoryName}</div>
            </div>
            <div className="w-full mt-1 pl-3">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

m bgmn jh,.mnimport * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center group", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200/50 dark:bg-slate-800/50 shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-[2px] border-indigo-500 bg-white shadow-[0_0_10px_rgba(99,102,241,0.4)] ring-offset-background transition-all duration-300 hover:scale-125 hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] hover:border-fuchsia-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-95 dark:bg-slate-950 dark:border-indigo-400" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ViewElement } from '@/types/view';

export interface BreadcrumbSectionProps {
  view: ViewElement[];
  setView: (view: ViewElement[]) => void;
}

export function BreadcrumbSection({
  view,
  setView
}: BreadcrumbSectionProps) {
  console.log("view", view)
  console.log("history", window.history)
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <Breadcrumb>
        <BreadcrumbList>
          {view.map((element, index) => {
            const isLast = index === view.length - 1;
            const emptyItem = <BreadcrumbPage>{element.label}</BreadcrumbPage>
            const linkItem = <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const nextView = view.slice(0, index + 1);
                window.history.pushState(nextView, '', `${element.id}`);
                setView(nextView);
              }}
            >
              {element.label}
            </BreadcrumbLink>

            return (
              <Fragment key={index}>
                <BreadcrumbItem>
                  {isLast ? emptyItem : linkItem}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

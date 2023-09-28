import { NgModule } from '@angular/core';
import { FroalaEditorModule } from './editor/editor.module';
import { FroalaViewModule } from './view/view.module';
import * as i0 from "@angular/core";
import * as i1 from "./editor/editor.module";
import * as i2 from "./view/view.module";
export class FERootModule {
}
/** @nocollapse */ FERootModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.9", ngImport: i0, type: FERootModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
/** @nocollapse */ FERootModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.2.9", ngImport: i0, type: FERootModule, imports: [i1.FroalaEditorModule, i2.FroalaViewModule], exports: [FroalaEditorModule,
        FroalaViewModule] });
/** @nocollapse */ FERootModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.2.9", ngImport: i0, type: FERootModule, imports: [FroalaEditorModule.forRoot(),
        FroalaViewModule.forRoot(), FroalaEditorModule,
        FroalaViewModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.9", ngImport: i0, type: FERootModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        FroalaEditorModule.forRoot(),
                        FroalaViewModule.forRoot()
                    ],
                    exports: [
                        FroalaEditorModule,
                        FroalaViewModule
                    ]
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmUtcm9vdC5tb2R1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9wcm9qZWN0cy9saWJyYXJ5L3NyYy9mZS1yb290Lm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzVELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDOzs7O0FBWXRELE1BQU0sT0FBTyxZQUFZOzs0SEFBWixZQUFZOzZIQUFaLFlBQVksbUVBSnJCLGtCQUFrQjtRQUNsQixnQkFBZ0I7NkhBR1AsWUFBWSxZQVJyQixrQkFBa0IsQ0FBQyxPQUFPLEVBQUU7UUFDNUIsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEVBRzFCLGtCQUFrQjtRQUNsQixnQkFBZ0I7MkZBR1AsWUFBWTtrQkFWeEIsUUFBUTttQkFBQztvQkFDUixPQUFPLEVBQUU7d0JBQ1Asa0JBQWtCLENBQUMsT0FBTyxFQUFFO3dCQUM1QixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7cUJBQzNCO29CQUNELE9BQU8sRUFBRTt3QkFDUCxrQkFBa0I7d0JBQ2xCLGdCQUFnQjtxQkFDakI7aUJBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgRnJvYWxhRWRpdG9yTW9kdWxlIH0gZnJvbSAnLi9lZGl0b3IvZWRpdG9yLm1vZHVsZSc7XG5pbXBvcnQgeyBGcm9hbGFWaWV3TW9kdWxlIH0gZnJvbSAnLi92aWV3L3ZpZXcubW9kdWxlJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW1xuICAgIEZyb2FsYUVkaXRvck1vZHVsZS5mb3JSb290KCksXG4gICAgRnJvYWxhVmlld01vZHVsZS5mb3JSb290KClcbiAgXSxcbiAgZXhwb3J0czogW1xuICAgIEZyb2FsYUVkaXRvck1vZHVsZSxcbiAgICBGcm9hbGFWaWV3TW9kdWxlXG4gIF1cbn0pXG5leHBvcnQgY2xhc3MgRkVSb290TW9kdWxlIHtcblxufVxuIl19
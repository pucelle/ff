# ff

## About

**ff** named from "Frequently-used Functions", it's a small JavaScript utility library for Web or NodeJs programming.

Every function work independently and have no dependency, so you can also copy one or some to your projects when required.


## Features

It includes two parts:

 - `base`: used to process base types of data.
 - `dom`: used to handle complicated things in building a web UI.

### Base

 - `array`: To add, remove, find items from array, do set operation, and order by, group by, aggregate datas just like what you do in SQL.
 - `date`: To read / write each part of a date, and format a date.
 - `duration`: Express a time period, type can be string, seconds count or object. Can be used to added to a date.
 - `emitter`: An event emitter as super class to listen and emit events. It supports scope argument when registering events, such that you don't need to cache binded handler to unregister it later.
 - `function`: Includes some classes and corresponding utility function to handle timeout, interval, throttle, debounce.
 - `number`: To process number decimal count, precision, mod, constrain.
 - `object`: To assign, deeply clone and compare objects.
 - `queue`: A queue class to run tasks with a specified concurrency.
 - `string`: To process strings, especially to match, format, transfer strings.
 - `sleep`: To sleep for a while.
 
### DOM

 - `align`: To align element to a target element by specified position, If no enough space, will adjust align position automatically. Used to build popup components.
 - `animate`: Run animation on element.
 - `css`: Get and set style values.
 - `html`: Encode and decode HTML codes.
 - `mouse-leave`: Call callback when mouse leaves several elements, Useful to build popup components.
 - `net`: Class to load several resources and gives a total progress.
 - `node`: To check node index, size, visible state.
 - `query`: To process URL query.
 - `scroll`: To test scroll state, scrolls element into view or to top.
 - `storage`: Just like localStorage, except here it read / write json datas.
 - `watch-layout`: To watch element's layout state and get notifications when they changed.


## Documentation

Simple [documentation](https://pucelle.github.io/ff/) is here (Thanks to [typedoc](https://typedoc.org/)).


## License

MIT
import { merge } from "lodash";
import Autocomplete from "./Autocomplete";
import Card from "./Card";
import Paper from "./Paper";
import Button from "./Button";

export default function ComponentsOverrides(theme) {
    return merge(Card(theme), Paper(theme), Autocomplete(theme), Button(theme));
}

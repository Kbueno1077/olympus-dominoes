import { merge } from "lodash";
import Autocomplete from "./Autocomplete";
import Button from "./Button";
import Card from "./Card";
import Chip from "./Chip";
import Dialog from "./Dialog";
import Input from "./Input";
import Paper from "./Paper";
import Slider from "./Slider";
import ToggleButton from "./ToggleButton";

export default function ComponentsOverrides(theme) {
  return merge(
    Card(theme),
    Paper(theme),
    Autocomplete(theme),
    Button(theme),
    Input(theme),
    Chip(theme),
    Slider(theme),
    Dialog(theme),
    ToggleButton(theme)
  );
}

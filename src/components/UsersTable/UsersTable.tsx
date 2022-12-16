import React from "react";
import { useState, useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";
import { Avatar, Button, Table, Input, Typography, Row } from "antd";
import type { ColumnsType } from 'antd/es/table';
import axios, { AxiosResponse } from "axios";
import $ from "jquery";

import UserInfo from "./UserInfo/UserInfo";
import "../../styles/UsersTable.scss"
import { getLineAndCharacterOfPosition } from "typescript";

React.useLayoutEffect = React.useEffect
const { Search } = Input;


interface Column {
    title: string,
    key: string,
    dataIndex: string
};


const UserTable = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [currentShow, setCurrentShow] = useState<number | null>(0);
    const [info, setInfo] = useState<string>("");
    const [requesting, setRequesting] = useState<Boolean>(false);

    const openedIndexes = useRef<number[]>([]);
    const getReposRef = useRef<Function | Promise<any>>();


    const columns: ColumnsType<Column> = [
        {
            title: "Avatar",
            key: "avatar",
            dataIndex: "avatar",
            render: (source) => (
                <Avatar shape="square" src={source}></Avatar>
            )
        },
        {
            title: "Username",
            key: "username",
            dataIndex: "username"
        },
        {
            title: "Type",
            key: "type",
            dataIndex: "type"
        },
        {
            title: "Options",
            key: "options",
            dataIndex: "index",
            render: (indexd) => (
                <Button onClick={() => showMore(indexd) as any}>
                    Show More
                </Button>
            )
        },
    ];


    function searchChange(e: any) {
        if (info) setInfo("");
        if (!e.target.value) {
            getUsers();
        };
    };

    function getUsers() {
        axios.get("https://api.github.com/users").then(e => {
            const usersData: any[] = e.data.map((e: any, i: number) => {
                return {
                    ...e,
                    index: i,
                    key: e.id,
                    username: e.login,
                    avatar: e.avatar_url
                }
            })
            setUsers(usersData);
        }).catch(e => {
            console.error(e);
        });
    };

    async function search(e: any) {
        axios.get("https://api.github.com/search/users?q=" + e.split(" ").join("") + "in:user").then(e => {
            const data = e.data.items.map((e: any, i: number) => {
                return {
                    ...e,
                    index: i,
                    key: e.id,
                    username: e.login,
                    avatar: e.avatar_url
                }
            });
            setUsers(data);
        }).catch(e => {
            console.error(e);
            setInfo("Not Found")
        });
    };


    function showMore(e: any) {
        if (currentShow == e || openedIndexes.current.includes(e)) {
            if (e == 0) {
                setCurrentShow(null);
                return;
            }
            setCurrentShow(-e);
            return;
        }
        setCurrentShow(e);
    };

    useEffect(() => {
        getUsers();
    }, []);

    useEffect(() => {
        setCurrentShow(1);
        $(`[id*=info]`).each((i, e) => {
            e.remove();
        });
        $('.loading-tr').each((i, e) => {
            e.remove();
        });
    }, [users])

    useEffect(() => {
        console.log(currentShow);

        if (currentShow as any < 0 || currentShow == null) {
            let opposite;
            currentShow == null ? opposite = 0 : opposite = -parseInt(currentShow as any);
            $(`#info-${opposite + 1}`).remove();
            if (openedIndexes.current.includes(opposite)) {
                openedIndexes.current.splice(openedIndexes.current.indexOf(opposite), 1);
            };
            return;
        }
        const currentTr: any = $(`.users-table-row`)[currentShow];
        console.log(currentTr);
        let newUser = users[currentShow as any];
        const loadingTr: JQuery<HTMLElement> = $("<tr class='loading-tr'></tr>")
        loadingTr
            .css({ display: "flex", alignItems: "center", justifyContent: "center", height: "100px" })
            .append("<p>Loading...</p>")
            .insertAfter(currentTr);
        // if (requesting) {
        //     return;
        // }
        setRequesting(true);
        getReposRef.current = (async function () {
            const response: AxiosResponse = await axios.get(users[parseInt(currentShow as any)].repos_url);
            newUser.repos = response.data.length;
            const strNode: string = ReactDOMServer.renderToString(<UserInfo user={newUser} />);
            let node: any = $.parseHTML(strNode)[0];
            node.setAttribute("style", "position: absolute; left: 25px; top: 0; height: 100px; width: 100%");
            const newTr: JQuery<HTMLElement> = $("<tr></tr>")
            newTr.attr("id", `info-${parseInt(currentShow as any) + 1}`)
                .css({ position: "relative", height: "100px" })
                .append(node)
                .insertAfter(currentTr);
            console.log("not there 2");

            loadingTr.remove();
            // setRequesting(false);
            openedIndexes.current.push(currentShow as number | any);
        })()
    }, [currentShow]);

    return (
        <>
            <Row align={"middle"}>
                <Search className="search-input" onChange={searchChange} onSearch={(e) => search(e)} />
                <Typography style={{ color: "red", marginRight: "10px" }}>{info}</Typography>
            </Row>
            <Table rowClassName={"users-table-row"} className="users-table" columns={columns} dataSource={users} pagination={{ pageSize: 20 }} />
        </>
    )
};

export default UserTable;